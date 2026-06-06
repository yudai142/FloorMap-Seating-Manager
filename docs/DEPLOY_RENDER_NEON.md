# Render + Neon デプロイ手順

このドキュメントは、Render.com に Docker イメージでデプロイし、Neon (Postgres) を接続するための手順を示します。

前提
- GitHub リポジトリが origin にプッシュ済みであること
- Neon のプロジェクトとデータベースを用意できること（neon.tech）

準備: Neon (データベース)
1. Neon にサインインして新しいプロジェクトを作成する。
2. ブランチ（デフォルト DB）を作成し、接続情報（connection string / DATABASE_URL）を取得する。
   - 例: `postgresql://user:password@ep-example-neon.neon.tech:5432/neondb`

Render 側のセットアップ
1. Render にログインし、New → Web Service を選択。
2. "Docker" を選び、リポジトリとブランチを指定する。
3. `render.yaml` が使える場合はそのまま利用可能。`dockerfilePath` は `./Dockerfile` を参照するようにしています。
4. 環境変数 / Secrets を設定:
   - `DATABASE_URL` に Neon の接続文字列を設定
   - `RAILS_MASTER_KEY` に `config/credentials/production.key` の内容または `RAILS_MASTER_KEY` を設定
   - 必要に応じて `SECRET_KEY_BASE` を設定（Rails が必要とする場合）

ローカルで本番イメージを試す
```bash
# ビルド
docker build -t floormap:prod .

# 起動（環境変数を渡す）
docker run --rm -p 3000:3000 \
  -e RAILS_ENV=production \
  -e DATABASE_URL='<your_neon_database_url>' \
  -e RAILS_MASTER_KEY='<your_master_key>' \
  floormap:prod
```

注意点
- Neon の接続文字列はプライベートなので Render の Dashboard で Secret に登録してください。
- Render の `plan` によって同時接続数やリソースが変わります。
- 大きなアセットのプリコンパイルがある場合はビルドタイムに失敗する可能性があるため、`buildCommand` を `bundle exec rails assets:precompile` に調整してください。

サポート情報
- 問題があれば、ビルドログや起動ログを共有してください。私の側で Dockerfile や render.yaml の調整を行います。
