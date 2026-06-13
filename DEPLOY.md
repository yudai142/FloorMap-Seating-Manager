# FloorMap Seating Manager デプロイメントガイド

本番環境へのデプロイメント手順を説明します。

## 対応プラットフォーム

- Heroku
- AWS (Elastic Beanstalk, EC2, AppRunner)
- Render
- Fly.io
- 独自サーバー（VPS など）

## 前提条件

### 本番環境で必須
- Rails マスターキー（`config/master.key`）
- AWS S3 バケット（ファイルアップロード用）
- PostgreSQL データベース
- Redis インスタンス
- SMTP サーバー（メール送信用）

### 推奨
- Sentry（エラー追跡）
- CDN（静的ファイル配信）
- SSL 証明書（HTTPS）

## 環境変数の設定

本番環境で以下の環境変数を設定してください：

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=floormap-production

# Rails
RAILS_ENV=production
RAILS_MASTER_KEY=...
SECRET_KEY_BASE=...

# Email
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
```

## デプロイメント前チェックリスト

- [ ] すべてのテストが通過している
- [ ] 本番環境の環境変数が設定されている
- [ ] データベースマイグレーションが記述されている
- [ ] 静的ファイル（CSS、JS）がビルドされている
- [ ] セキュリティ設定が適切である（CORS、CSP など）
- [ ] SSL/HTTPS が有効になっている
- [ ] アラートとロギングが設定されている
- [ ] バックアップ戦略が確立されている

## Heroku へのデプロイメント

### 1. Heroku CLI をインストール

```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2. Heroku アプリケーション作成

```bash
heroku create floormap-app
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
```

### 3. 環境変数設定

```bash
heroku config:set RAILS_MASTER_KEY=$(cat config/master.key)
heroku config:set AWS_ACCESS_KEY_ID=your_key_id
heroku config:set AWS_SECRET_ACCESS_KEY=your_secret
heroku config:set AWS_S3_BUCKET=your_bucket
```

### 4. デプロイメント

```bash
git push heroku main
heroku run rails db:migrate
heroku open
```

## AWS Elastic Beanstalk へのデプロイメント

### 1. EB CLI をインストール

```bash
pip install awsebcli --upgrade
```

### 2. EB アプリケーション初期化

```bash
eb init -p "Docker running on 64bit Amazon Linux 2" floormap
```

### 3. 環境作成

```bash
eb create production --instance-type t3.medium
```

### 4. 環境変数設定

```bash
eb setenv RAILS_MASTER_KEY=$(cat config/master.key) \
          AWS_ACCESS_KEY_ID=... \
          AWS_SECRET_ACCESS_KEY=... \
          DATABASE_URL=postgresql://...
```

### 5. デプロイメント

```bash
eb deploy
```

## Render へのデプロイメント

### 1. Render アカウント作成

https://dashboard.render.com/ でサインアップ

### 2. GitHub リポジトリを接続

Render Dashboard で新しい Web Service を作成し、GitHub リポジトリを選択

### 3. 環境変数設定

Dashboard で以下を設定：
- `RAILS_ENV=production`
- `RAILS_MASTER_KEY=...`
- `DATABASE_URL=...` (Postgres Add-on から自動設定)
- `REDIS_URL=...` (Redis Add-on から自動設定)

### 4. デプロイメント

GitHub にプッシュすると自動的にデプロイされます。

## デプロイメント後確認

```bash
# データベースマイグレーション確認
rails db:migrate

# ログ確認
heroku logs -t  # Heroku
eb logs  # Elastic Beanstalk

# ヘルスチェック
curl https://your-domain/up
```

## トラブルシューティング

### アセットが 404 を返す

```bash
# アセットプリコンパイル
RAILS_ENV=production rails assets:precompile
git add public/assets
git commit -m "Precompile assets"
```

### データベース接続エラー

```bash
# マイグレーション実行確認
heroku run rails db:migrate
heroku run rails db:seed  # 初期データ
```

### メモリ不足エラー

```bash
# インスタンス タイプをアップグレード
eb scale 1 --instance-type t3.large
```

## 本番環境ベストプラクティス

1. **セキュリティ**
   - 強いパスワード・キーを使用
   - HTTPS を強制
   - CORS をホワイトリスト化
   - SQL インジェクション対策確認

2. **バックアップ**
   - 日次 DB バックアップ設定
   - S3 ファイルのバージョニング有効化

3. **監視**
   - エラーロギング（Sentry など）
   - パフォーマンス監視
   - アラート設定

4. **スケーリング**
   - Sidekiq ワーカー数調整
   - Redis 容量確保
   - CDN キャッシュ設定

## ロールバック

```bash
# Heroku
heroku releases
heroku rollback v100

# Elastic Beanstalk
eb status
eb abort
```

## さらに詳しく

- [Rails Production チェックリスト](https://guides.rubyonrails.org/security.html)
- [Heroku ドキュメント](https://devcenter.heroku.com/)
- [AWS ドキュメント](https://docs.aws.amazon.com/)
