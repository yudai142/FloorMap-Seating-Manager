---
title: ISSUE-001: プロジェクト骨組み — Rails + Inertia + React + Vite + Tailwind
labels: [project, scaffold]
---

概要
---
新規プロジェクトの骨組みを作成します。Rails 8 をベースに、Inertia.js + React(TypeScript) + Vite + Tailwind の開発環境を準備します。

目的
---
- 開発に必要な依存関係と基本ファイルを用意する
- CI が基本的なテストを実行できるようにプレースホルダを作成する

受け入れ基準
---
- `Gemfile` と `package.json` が存在する
- `spec/` に RSpec のベースファイルがある
- `.github/workflows/ci.yml` の雛形がある

ブランチ
---
`feature/ISSUE-001-project-scaffold`

Docker 開発環境（追記）
---
開発は Docker コンテナ内で行うための環境を整備します。目的は開発環境の再現性を高め、ローカルの環境差異による手戻りを減らすことです。まずは開発用の `Dockerfile` と `docker-compose.yml` を用意し、以下の要件を満たします。

要件
- `Dockerfile`（Ruby + Node + Yarn/PNPM を含む）がプロジェクトルートに存在する
- `docker-compose.yml` で `web` サービス（Rails）と `db`（PostgreSQL）、`node`（または同一コンテナで vite）が起動できる
- `Makefile` または `bin/` の wrapper により、`make dev` または `bin/dev` 相当でコンテナ内の `rails server` と `vite dev` を起動できる
- コンテナ内で `bundle exec rspec` が実行できる

受け入れ基準（追記）
- `Dockerfile` と `docker-compose.yml` がリポジトリに追加されている
- ドキュメント（README の開発セクション）に、コンテナを使った初回セットアップ手順（`docker compose up --build` など）が記載されている
- 開発コンテナ内でテストを実行できる（`docker compose run --rm web bundle exec rspec` が成功する）

注意
- 初期は開発用途に限定し、本番コンテナ最適化（マルチステージビルドやアセットプリコンパイル最適化）は別 Issue とします。

