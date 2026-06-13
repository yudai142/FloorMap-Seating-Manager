# FloorMap Seating Manager セットアップガイド

このドキュメントは、FloorMap Seating Manager を開発環境で実行するための手順を説明します。

## 前提条件

- Ruby 3.2 以上
- Node.js 18 以上
- PostgreSQL 14 以上
- Redis 6 以上
- Git

## インストール手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd "FloorMap Seating Manager"
```

### 2. 依存関係のインストール

```bash
# Ruby gems
bundle install

# JavaScript dependencies
yarn install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、必要な値を設定します：

```bash
cp .env.example .env
```

以下の変数を設定してください：

- `DATABASE_URL`: PostgreSQL接続文字列
- `REDIS_URL`: Redis接続文字列
- `AWS_*`: S3アップロード用（本番環境で必須）
- `SMTP_*`: メール送信用（オプション）

### 4. データベース初期化

```bash
# データベース作成とマイグレーション実行
bundle exec rails db:setup

# または、既存DBの場合
bundle exec rails db:create
bundle exec rails db:migrate

# テストDB初期化
bundle exec rails db:test:prepare
```

### 5. 開発サーバー起動

```bash
# Rails サーバーを起動（ポート 3000）
bundle exec rails server

# 別のターミナルで JavaScript ビルドを監視
./bin/vite dev
```

ブラウザで http://localhost:3000 にアクセスしてください。

### 6. Redisサーバー起動（別ターミナル）

```bash
redis-server
```

### 7. Sidekiq（バックグラウンドジョブ - オプション）

```bash
bundle exec sidekiq
```

## テスト実行

```bash
# RSpec（バックエンド）
bundle exec rspec

# Vitest（フロントエンド）
yarn test

# 統合テスト
bundle exec rspec --pattern spec/integration/**/*_spec.rb
```

## 主な機能

### Stage 1 - 品質・テスト基盤
- ✅ SimpleCov: テストカバレッジ報告（最小 70%）
- ✅ Kaminari: ページネーション（20 件/ページ）
- ✅ Ransack: ルーム検索

### Stage 2 - 機能拡張
- ✅ CSV エクスポート: ルーム・座席データ
- ✅ PaperTrail: 監査ログ（Room/Seat）
- ✅ RailsAdmin: 管理ダッシュボード（/admin）
- ✅ API v1: RESTful API（/api/v1）

### Stage 3 - セキュリティ・パフォーマンス
- ✅ Active Storage: フロアプラン画像アップロード
- ✅ Redis キャッシング: ページネーションキャッシュ（5分）
- ✅ Devise 2FA: TOTP を使用した二要素認証
- ✅ rack-mini-profiler: 開発環境用パフォーマンス監視

### 追加機能
- ✅ ユーザー設定ページ
- ✅ 通知システム
- ✅ ナビゲーションバー
- ✅ エラーページ（404, 400）

## トラブルシューティング

### PostgreSQL に接続できない

```bash
# PostgreSQL サービス起動確認
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# または手動起動
pg_ctl -D /usr/local/var/postgres start
```

### Redis に接続できない

```bash
# Redis サービス起動確認
redis-cli ping  # "PONG"が返ればOK

# または手動起動
redis-server
```

### ポート3000が使用中

```bash
# 別のポートで起動
bundle exec rails server -p 3001
```

### JavaScript モジュールエラー

```bash
# キャッシュをクリア
rm -rf node_modules
yarn install
```

## デプロイメント

本番環境へのデプロイは DEPLOY.md を参照してください。

## 開発リソース

- [Rails ドキュメント](https://guides.rubyonrails.org/)
- [React ドキュメント](https://react.dev/)
- [Inertia.js ドキュメント](https://inertiajs.com/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/)

## ライセンス

詳細は LICENSE ファイルを参照してください。
