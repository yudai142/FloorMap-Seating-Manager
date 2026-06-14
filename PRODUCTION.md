# FloorMap Seating Manager — 本番環境デプロイメントガイド

このドキュメントは、FloorMap Seating Manager を本番環境にデプロイするための手順を説明します。

## システム要件

- Docker 20.10+
- Docker Compose 2.0+
- PostgreSQL 15+ (またはマネージドサービス)
- Redis 7+ (またはマネージドサービス)
- SMTP メールサーバー（SendGrid など）

## デプロイメント前チェックリスト

### 1. 環境変数設定

```bash
# .env.production.example をコピーして .env.production を作成
cp .env.production.example .env.production

# 以下を編集して本番値を設定
vi .env.production

# 必須:
# - RAILS_MASTER_KEY: config/master.key から取得
# - SECRET_KEY_BASE: bundle exec rails secret で生成
# - DATABASE_URL: PostgreSQL接続文字列
# - REDIS_URL: Redis接続文字列
# - AWS_S3_BUCKET: AWS S3 バケット名
# - SMTP_PASSWORD: メールサーバーのパスワード
```

### 2. Docker イメージビルド

```bash
# Dockerfile.prod から本番用イメージをビルド
docker build -f Dockerfile.prod -t floormap:latest .

# コンテナレジストリにプッシュ（オプション）
docker tag floormap:latest myregistry.azurecr.io/floormap:latest
docker push myregistry.azurecr.io/floormap:latest
```

### 3. データベースマイグレーション

```bash
# 初回デプロイ時のみ DB を初期化
docker-compose -f docker-compose.prod.yml run web rails db:create
docker-compose -f docker-compose.prod.yml run web rails db:migrate
docker-compose -f docker-compose.prod.yml run web rails db:seed
```

### 4. 環境変数検証

```bash
# RAILS_MASTER_KEY が正しいことを確認
docker-compose -f docker-compose.prod.yml run web rails runner "puts Rails.env"

# シークレットが正しくロードされているか確認
docker-compose -f docker-compose.prod.yml run web rails runner "puts Rails.application.credentials.dig(:aws, :access_key_id).present?"
```

## デプロイメント手順

### ローカル環境での検証

```bash
# ローカルで本番設定をテスト
export $(cat .env.production | xargs)
docker-compose -f docker-compose.prod.yml up

# ヘルスチェック
curl http://localhost:3000/up
```

### 本番環境へのデプロイ

#### オプション 1: Docker Compose（VPS/専有サーバー）

```bash
# サーバーにログイン
ssh user@production.example.com

# 最新のコードをプル
cd /app
git pull origin main

# 環境変数を設定
nano .env.production

# コンテナを起動
docker-compose -f docker-compose.prod.yml up -d

# ログを確認
docker-compose -f docker-compose.prod.yml logs -f web

# データベースマイグレーション実行（既存環境の場合）
docker-compose -f docker-compose.prod.yml exec web rails db:migrate
```

#### オプション 2: Kubernetes

```yaml
# deployment.yaml の例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: floormap
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: web
        image: myregistry.azurecr.io/floormap:latest
        ports:
        - containerPort: 3000
        env:
        - name: RAILS_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: floormap-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: floormap-secrets
              key: redis-url
        livenessProbe:
          httpGet:
            path: /up
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

```bash
# クラスタにデプロイ
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

#### オプション 3: Heroku

```bash
# Heroku リモートを追加
heroku git:remote -a floormap-app

# 環境変数を設定
heroku config:set RAILS_MASTER_KEY=$(cat config/master.key)
heroku config:set AWS_ACCESS_KEY_ID=xxx
heroku config:set AWS_SECRET_ACCESS_KEY=xxx

# デプロイ
git push heroku main

# マイグレーション実行
heroku run rails db:migrate
```

## デプロイ後の確認

```bash
# ヘルスチェック
curl https://floormap.example.com/up

# ログを確認
docker-compose -f docker-compose.prod.yml logs -f

# 管理画面へアクセス可能か確認
curl -u admin:password https://floormap.example.com/admin

# Sidekiq Web UI へアクセス可能か確認
curl -u admin:password https://floormap.example.com/sidekiq

# データベース接続確認
docker-compose -f docker-compose.prod.yml exec web rails runner "puts User.count"
```

## 本番環境後処理

### 1. SSL/TLS 証明書設定

```bash
# Let's Encrypt の自動更新設定
# (nginx-letsencrypt コンテナを追加)
```

### 2. バックアップ設定

```bash
# 日次バックアップをスケジュール
0 2 * * * /app/scripts/backup_to_s3.sh

# S3 ライフサイクルルール設定
# - 7日後に低頻度アクセスに移動
# - 30日後に削除
```

### 3. モニタリング設定

```bash
# Sentry エラートラッキング
# Heroku or Cloud 環境で Sentry アドオンを有効化

# ログ集約
# CloudWatch / ELK Stack / Datadog に設定

# パフォーマンス監視
# New Relic / Datadog APM を設定
```

### 4. セキュリティ強化

```bash
# WAF ルール設定（AWS ALB など）
# - SQL インジェクション
# - XSS 攻撃
- DDoS 保護

# レート制限確認
curl -I https://floormap.example.com/api/v1/rooms
# X-RateLimit-* ヘッダーが返されているか確認

# CORS 設定確認
curl -H "Origin: https://external.com" https://floormap.example.com/
```

## トラブルシューティング

### コンテナが起動しない

```bash
# ログを確認
docker-compose -f docker-compose.prod.yml logs web

# 環境変数が正しいか確認
docker-compose -f docker-compose.prod.yml config
```

### データベース接続エラー

```bash
# PostgreSQL 接続テスト
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d floormap_production -c "SELECT 1"

# DATABASE_URL が正しいか確認
echo $DATABASE_URL
```

### メールが送信されない

```bash
# SMTP設定確認
docker-compose -f docker-compose.prod.yml exec web rails runner "
  Devise.mailer_sender
  ActionMailer::Base.smtp_settings
"
```

## スケーリング

```bash
# Sidekiq ワーカー数を増やす
docker-compose -f docker-compose.prod.yml scale sidekiq=5

# Web サーバーを複数起動（Nginx でロードバランス）
docker-compose -f docker-compose.prod.yml scale web=3
```

## ロールバック

```bash
# 前のバージョンに戻す
git revert HEAD
git push origin main

# または

git checkout <commit-hash>
docker build -f Dockerfile.prod -t floormap:rollback .
docker-compose -f docker-compose.prod.yml up -d
```

## サポート

問題が発生した場合は、以下を確認してください：

1. ログを確認: `docker-compose logs -f`
2. ヘルスチェック実行: `curl /up`
3. GitHub Issues で既知の問題を検索
4. SETUP.md でセットアップ手順を再確認
