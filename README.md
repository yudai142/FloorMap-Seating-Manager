# FloorMap Seating Manager

簡易説明と開発用メモ。

このリポジトリは「部屋図を描いて座席を配置し、着席状況をリアルタイムで管理する」Web アプリのソースです。

MVP 機能
- 部屋の新規作成（名前・幅・高さ）
- SVG キャンバスで壁・座席を描画・配置・保存
- フロアページでの着席・離席・席移動
- ActionCable によるリアルタイム同期

まずは `feature/ISSUE-001-project-scaffold` ブランチで環境構築を行います。
