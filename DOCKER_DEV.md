# Docker 開発環境ガイド

## 📝 はじめに

このプロジェクトは Docker を使った開発環境を提供しています。Makefile を使うことで、開発効率を最大化できます。

## 🚀 クイックスタート

### 初回セットアップ（最初の1回のみ）

```bash
make setup
```

イメージをビルドしてコンテナを起動します。DB マイグレーションも自動実行されます。

### 日常の開発（毎日これを実行）

```bash
make dev
```

ボリュームマウント済みなので、ホスト側の code 変更が自動反映されます。**`--build` は不要です！**

### コンテナを停止

```bash
make down
```

## 📦 コマンド一覧

| コマンド | 説明 |
|--------|------|
| `make setup` | 初回セットアップ（イメージビルド + 起動） |
| `make dev` | 開発環境起動（毎回これを使用） |
| `make down` | コンテナを停止 |
| `make logs` | Web サービスのログを表示 |
| `make logs-all` | 全サービスのログを表示 |
| `make migrate` | DB マイグレーション実行 |
| `make seed` | DB シード実行 |
| `make console` | Rails コンソール起動 |
| `make update-deps` | Gemfile/package.json 更新後にビルド |
| `make clean-node` | npm モジュールリセット（@rollup エラー時） |
| `make rebuild` | npm rebuild（node-gyp エラー時） |
| `make clean` | コンテナ・ボリューム削除（完全リセット） |

## 🔄 自動反映の仕組み

開発環境では以下が自動的に反映されます：

- **Ruby code** (`app/` 配下) → Rails が自動リロード
- **JavaScript/CSS** → Vite ホットモジュールリプレースメント（HMR）
- **View ファイル** → 自動リロード
- **設定ファイル** (`config/` 配下) → Rails 再起動で反映

## ⚠️ 再ビルドが必要な場合

以下の変更時のみ `make update-deps` を実行してください：

- `Gemfile` を変更した
- `package.json` を変更した

```bash
make update-deps
```

## 🆘 トラブルシューティング

### コンテナが起動しない

```bash
make clean
make setup
```

完全にリセットして再セットアップします。

### ホットリロードが効かない

1. コンテナが起動しているか確認: `docker-compose ps`
2. ログを確認: `make logs`
3. コンテナを再起動: `make down && make dev`

### DB がリセットされた

`docker-compose down -v` で volume が削除されると DB がリセットされます。

通常は `make down`（volume 保持）を使用してください。

### npm エラー: Cannot find module @rollup/rollup-linux-arm64-gnu

**原因：** ホスト（macOS ARM64）とコンテナ（Linux ARM64）で異なる node_modules バイナリが混在している。

**解決方法：**

```bash
make clean-node
```

node_modules volume をリセットして、コンテナ内で再インストールします。

### npm/node-gyp エラー

**原因：** ネイティブバイナリのビルド失敗

**解決方法：**

```bash
make rebuild
```

コンテナ内で npm rebuild を実行します。

## 📍 ホストマシンでの開発

Docker を使わずホストで直接開発する場合：

```bash
# ホストで Ruby/Node をセットアップ
bundle install
npm install

# dev サーバーを起動
./bin/dev
```

## 📚 参考資料

- [docker-compose.yml](./docker-compose.yml) - サービス定義
- [Dockerfile.dev](./Dockerfile.dev) - イメージ定義
