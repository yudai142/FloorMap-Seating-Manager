# データバックアップ・復旧ガイド

## 概要

このアプリケーションは PostgreSQL データベースの自動バックアップと、AWS S3 への保存、および緊急時のデータ復旧機能を提供します。

Sidekiq を使用して以下を自動実行：
- 毎日 2:00 AM に自動バックアップ
- AWS S3 への暗号化アップロード
- 30日以上前のバックアップの自動削除

## セットアップ

### 1. AWS S3 設定

```bash
# AWS CLI で S3 バケット作成
aws s3 mb s3://floormap-backups --region us-east-1

# 暗号化設定
aws s3api put-bucket-encryption \
  --bucket floormap-backups \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 2. 環境変数設定

```bash
# .env
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=floormap-backups
```

### 3. Redis インストール

Sidekiq は Redis が必要です：

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis-server

# Docker
docker run -d --name redis -p 6379:6379 redis:latest
```

### 4. Sidekiq 起動

```bash
# 開発環境
bundle exec sidekiq -c config/sidekiq.yml

# 本番環境（systemd サービスで管理）
sudo systemctl start sidekiq
```

### 5. データベース設定確認

pg_dump が利用可能か確認：

```bash
which pg_dump
pg_dump --version
```

## バックアップ操作

### 手動バックアップ実行

```bash
# API 経由
curl -X POST http://localhost:3000/backups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# または Sidekiq コンソール経由
BackupJob.perform_async(nil)
```

### バックアップ一覧確認

```bash
# API 経由
curl http://localhost:3000/backups \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

応答例：
```json
{
  "backups": [
    {
      "id": 1,
      "name": "backup-20260613-020000",
      "status": "completed",
      "backup_type": "automatic",
      "size_mb": 45.23,
      "created_at": "2026-06-13T02:00:00Z",
      "completed_at": "2026-06-13T02:05:00Z"
    }
  ],
  "last_backup": { /* ... */ }
}
```

### バックアップダウンロード

```bash
curl -X GET http://localhost:3000/backups/1/download \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  --output backup.sql.gz
```

## 復旧操作

### 緊急時のデータ復旧

```bash
# API 経由でデータベース復旧を開始
curl -X POST http://localhost:3000/backups/1/restore \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 手動復旧（コマンドライン）

```bash
# S3 からバックアップをダウンロード
aws s3 cp s3://floormap-backups/backups/backup-file.sql.gz /tmp/

# バックアップを復旧
gunzip -c /tmp/backup-file.sql.gz | \
  psql -h localhost -U postgres -d floormap_production

# アプリケーションを再起動
systemctl restart floormap-app

# または
docker restart floormap-web
```

### 復旧確認

```ruby
# Rails コンソール
rails console
Backup.last  # 復旧されたバックアップを確認
Room.count   # データベースが復旧されたことを確認
Seat.count
```

## バックアップ戦略

### 保持期間

| タイプ | 保持期間 | 数量 |
|--------|---------|------|
| 日次自動 | 30日 | 30個 |
| 週次 | 90日 | 13個 |
| 月次 | 1年 | 12個 |
| 手動 | 無期限 | 無制限 |

### S3 ライフサイクルポリシー

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket floormap-backups \
  --lifecycle-configuration file://lifecycle.json
```

`lifecycle.json`:
```json
{
  "Rules": [
    {
      "Id": "AutoDeleteOldBackups",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "backups/"
      },
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
```

## 復旧テスト

### 定期的な復旧検証

毎月の復旧テストスケジュール：

```ruby
# BackupValidationJob
class BackupValidationJob
  include Sidekiq::Job

  def perform
    # 最新の成功したバックアップを取得
    backup = Backup.successful.first
    return unless backup

    # テストデータベースに復旧
    restore_to_test_db(backup)

    # データ整合性を検証
    validate_backup(backup)

    # 通知を送信
    notify_validation_result(backup)
  end
end
```

実行：
```bash
# 毎月第1日曜日 23:00 に実行
# config/sidekiq_schedule.yml に設定
backup_validation:
  cron: '0 23 ? * SUN#1'
  class: BackupValidationJob
```

## トラブルシューティング

### バックアップが失敗する

1. Sidekiq が実行中か確認
   ```bash
   ps aux | grep sidekiq
   ```

2. Redis が実行中か確認
   ```bash
   redis-cli ping  # PONG が返ればOK
   ```

3. AWS 認証情報を確認
   ```bash
   aws sts get-caller-identity
   ```

4. pg_dump が実行できるか確認
   ```bash
   PGPASSWORD='password' pg_dump -h localhost -U postgres database_name > /tmp/test.sql
   ```

### 復旧に失敗する

1. バックアップファイルが破損していないか確認
   ```bash
   gunzip -t backup.sql.gz
   ```

2. データベースユーザーの権限を確認
   ```bash
   sudo -u postgres psql -c "\du"
   ```

3. ディスク容量を確認
   ```bash
   df -h
   ```

### S3 アップロードが失敗する

1. AWS 認証情報を確認
   ```bash
   aws configure list
   ```

2. S3 バケットへのアクセス権限を確認
   ```bash
   aws s3 ls s3://floormap-backups/
   ```

3. IAM ポリシーを確認
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::floormap-backups",
           "arn:aws:s3:::floormap-backups/*"
         ]
       }
     ]
   }
   ```

## モニタリング

### Sidekiq Web UI

```ruby
# config/routes.rb
require 'sidekiq/web'

Sidekiq::Web.use Rack::Auth::Basic do |username, password|
  username == ENV['SIDEKIQ_USERNAME'] && password == ENV['SIDEKIQ_PASSWORD']
end

mount Sidekiq::Web => '/sidekiq'
```

アクセス: http://localhost:3000/sidekiq

### ログ監視

```bash
# Sidekiq ログを監視
tail -f log/sidekiq.log | grep backup

# Redis ログを監視
redis-cli monitor
```

## ベストプラクティス

1. **定期的なテスト**
   - 月 1 回以上復旧テストを実行
   - テスト環境で復旧を検証

2. **複数リージョンでの保存**
   ```bash
   aws s3 cp s3://floormap-backups s3://floormap-backups-replica \
     --region ap-northeast-1 --recursive
   ```

3. **バックアップの暗号化**
   - AWS S3 サーバー側暗号化を有効化
   - 転送中は HTTPS を使用

4. **アクセス制御**
   - IAM ロールを使用した最小権限の原則
   - バックアップファイルへのアクセスを制限

5. **監視とアラート**
   - バックアップ失敗時に通知
   - バックアップサイズの異常を監視
   - 復旧テスト結果をログに記録

## リソース

- [PostgreSQL pg_dump マニュアル](https://www.postgresql.org/docs/current/app-pgdump.html)
- [AWS S3 ユーザーガイド](https://docs.aws.amazon.com/s3/)
- [Sidekiq ドキュメント](https://github.com/sidekiq/sidekiq/wiki)
- [Sidekiq-Scheduler](https://github.com/moove-it/sidekiq-scheduler)
