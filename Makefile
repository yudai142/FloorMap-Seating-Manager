.PHONY: setup dev down logs clean migrate seed console update-deps clean-node rebuild

## セットアップ（最初の1回のみ）
setup:
	docker-compose up --build

## 開発環境を起動（毎回これを使用）
dev:
	docker-compose up

## コンテナを停止
down:
	docker-compose down

## ログを表示（web サービスのみ）
logs:
	docker-compose logs -f web

## ログを表示（全サービス）
logs-all:
	docker-compose logs -f

## コンテナを停止してボリュームを削除（完全リセット）
clean:
	docker-compose down -v

## node_modules volume をリセット（npm 関連エラー時）
clean-node:
	docker-compose down
	docker volume rm $$(docker volume ls -q | grep node_modules) || true
	docker-compose up --build

## DB マイグレーション実行
migrate:
	docker-compose exec web bundle exec rails db:migrate

## DB シード実行
seed:
	docker-compose exec web bundle exec rails db:seed

## Rails コンソール起動
console:
	docker-compose exec web bundle exec rails console

## 依存関係を更新（Gemfile・package.json 変更後）
update-deps:
	docker-compose up --build

## npm rebuild（node-gyp エラーなど）
rebuild:
	docker-compose exec web npm rebuild
