# リアルタイム通知機能ガイド

## 概要

このアプリケーションは ActionCable を使用したリアルタイム WebSocket 通知機能を実装しています。チェックイン/チェックアウトイベント、座席状態変更などをリアルタイムで全ユーザーに通知します。

## 機能

### 通知タイプ

1. **check_in** - ユーザーがチェックインしたとき
   - タイトル: `{名前}さんがチェックインしました`
   - メッセージ: `座席 {座席ラベル} にチェックインしました`

2. **check_out** - ユーザーがチェックアウトしたとき
   - タイトル: `{名前}さんがチェックアウトしました`
   - メッセージ: `座席 {座席ラベル} からチェックアウトしました`

3. **seat_update** - 座席状態が更新されたとき
   - 座席の位置変更や属性更新

### UI コンポーネント

#### NotificationBell（通知ベル）

- ヘッダーに配置されるベルアイコン
- 未読通知数を赤いバッジで表示
- クリックでドロップダウンメニュー展開

**機能:**
- 最新 50 件の通知を表示
- 未読通知はハイライト表示
- クリックで通知を既読にする
- 「すべて既読」ボタンで一括既読
- タイムスタンプ表示（日本語形式）

## セットアップ

### 1. マイグレーション実行

```bash
bundle exec rails db:migrate
```

### 2. ActionCable 設定確認

`config/cable.yml` が正しく設定されていることを確認：

```yaml
development:
  adapter: async

production:
  adapter: redis
  url: <%= ENV.fetch("REDIS_URL") %>
```

### 3. React コンポーネント統合

ヘッダーに NotificationBell を追加：

```jsx
import NotificationBell from './components/Notifications/NotificationBell'

export default function Header() {
  return (
    <header>
      <nav>
        {/* その他のナビゲーション */}
        <NotificationBell />
      </nav>
    </header>
  )
}
```

### 4. ActionCable Consumer 初期化

`app/javascript/channels/consumer.js` に以下を追加（既存の場合はスキップ）：

```javascript
import consumer from '../channels/consumer'
window.consumer = consumer
```

## API エンドポイント

### 通知一覧取得

```http
GET /notifications
```

**レスポンス:**
```json
{
  "notifications": [
    {
      "id": 1,
      "notification_type": "check_in",
      "title": "山田太郎さんがチェックインしました",
      "message": "座席 S1 にチェックインしました",
      "data": {
        "seat_id": 1,
        "seat_label": "S1",
        "occupant_name": "山田太郎"
      },
      "read_at": null,
      "created_at": "2026-06-13T12:00:00Z"
    }
  ],
  "unread_count": 5
}
```

### 未読通知数取得

```http
GET /notifications/unread_count
```

**レスポンス:**
```json
{
  "unread_count": 5
}
```

### 通知を既読にする

```http
PATCH /notifications/:id/mark_as_read
```

### すべての通知を既読にする

```http
PATCH /notifications/mark_all_as_read
```

### 通知を削除する

```http
DELETE /notifications/:id
```

## WebSocket メッセージ

### 新しい通知を受信

**メッセージ:**
```json
{
  "type": "notification",
  "notification": {
    "id": 1,
    "notification_type": "check_in",
    "title": "山田太郎さんがチェックインしました",
    "message": "座席 S1 にチェックインしました",
    "data": { /* ... */ },
    "read_at": null,
    "created_at": "2026-06-13T12:00:00Z"
  }
}
```

### 通知が既読になったことを通知

**メッセージ:**
```json
{
  "type": "notification_read",
  "notification": {
    "id": 1,
    "read_at": "2026-06-13T12:05:00Z"
  }
}
```

### すべての通知が既読になったことを通知

**メッセージ:**
```json
{
  "type": "all_notifications_read"
}
```

## データモデル

### Notification モデル

```ruby
class Notification < ApplicationRecord
  belongs_to :user
  
  enum notification_type: { 
    check_in: 'check_in', 
    check_out: 'check_out', 
    seat_update: 'seat_update' 
  }
  
  # スコープ
  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }
  
  # メソッド
  def unread?
  def mark_as_read!
  def self.create_notification(user, type, title, message, data)
end
```

### スキーマ

| カラム | 型 | 説明 |
|--------|-----|------|
| id | integer | 主キー |
| user_id | integer | ユーザーID |
| notification_type | string | 通知タイプ |
| title | string | 通知タイトル |
| message | text | 通知メッセージ |
| data | jsonb | 追加データ |
| read_at | datetime | 既読日時（nullで未読） |
| created_at | datetime | 作成日時 |
| updated_at | datetime | 更新日時 |

## 使用例

### 通知を作成して全ユーザーに送信

```ruby
# app/controllers/seats_controller.rb
def check_in
  @seat = Seat.find(params[:id])
  if @seat.update(occupied: true, occupant_name: params[:occupant_name])
    # 座席更新をブロードキャスト
    ActionCable.server.broadcast("room_#{@seat.room_id}", {
      type: 'seat_update',
      seat: @seat.as_json(only: %i[id x y label occupied occupant_name])
    })

    # 全ユーザーに通知を送信
    User.find_each do |user|
      notification = Notification.create_notification(
        user,
        'check_in',
        "#{params[:occupant_name]}さんがチェックインしました",
        "座席 #{@seat.label} にチェックインしました",
        {
          seat_id: @seat.id,
          seat_label: @seat.label,
          occupant_name: params[:occupant_name]
        }
      )
      # WebSocket でブロードキャスト
      ActionCable.server.broadcast("user_#{user.id}", {
        type: 'notification',
        notification: notification.as_json
      })
    end
  end
end
```

### JavaScript から通知チャネルを購読

```javascript
const subscription = window.consumer.subscriptions.create(
  { channel: 'NotificationChannel' },
  {
    connected() {
      console.log('Connected to notifications')
    },
    received(data) {
      if (data.type === 'notification') {
        // 新しい通知を処理
        updateNotificationUI(data.notification)
      }
    }
  }
)
```

## パフォーマンス最適化

### 通知の保持期間

デフォルトでは全通知を保持します。古い通知を削除するには：

```ruby
# 30日以上前の通知を削除するタスク
Notification.where('created_at < ?', 30.days.ago).delete_all
```

スケジュール実行（Sidekiq など）：

```ruby
# config/initializers/sidekiq.rb
sidekiq_options retry: 5

class NotificationCleanupJob
  include Sidekiq::Job

  def perform
    Notification.where('created_at < ?', 30.days.ago).delete_all
  end
end

# スケジュール
Sidekiq::Cron::Job.create(
  name: 'Clean old notifications',
  cron: '0 2 * * *',  # 毎日 2:00 AM
  class: 'NotificationCleanupJob'
)
```

### 通知の制限

ユーザーあたり最新 100 件のみ取得：

```ruby
@notifications = current_user.notifications.recent.limit(100)
```

## トラブルシューティング

### WebSocket が接続されない

1. ActionCable が有効化されているか確認
2. Redis が起動しているか確認（本番環境）
3. ブラウザの DevTools で WebSocket コネクションを確認

```javascript
// コンソールで確認
console.log(window.consumer)
```

### 通知が表示されない

1. NotificationChannel が購読されているか確認
2. 通知レコードがデータベースに作成されているか確認

```ruby
Notification.last(10)
```

3. ブラウザの JavaScript エラーを確認

### パフォーマンス問題

1. 通知テーブルにインデックスが張られているか確認
2. 古い通知を削除するスケジュールタスクを実行
3. Redis のパフォーマンスを監視

## リソース

- [Rails ActionCable](https://guides.rubyonrails.org/action_cable_overview.html)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Redis](https://redis.io/)
