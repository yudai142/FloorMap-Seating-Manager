---
title: ISSUE-007: ActionCable RoomChannel (realtime)
labels: [realtime, backend, frontend]
---

概要
---
Room 単位で ActionCable チャネルを実装し、座席配置・着席状態の変更をリアルタイムに配信します。クライアントは購読して UI を更新します。

受け入れ基準
---
- `RoomChannel` が存在する
- 2つ以上のブラウザで変更が同期される（テスト/マニュアル検証）

ブランチ
---
`feature/ISSUE-007-realtime`
