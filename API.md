# FloorMap Seating Manager API v1 ドキュメント

RESTful API エンドポイントの使用方法を説明します。

## ベース URL

```
http://localhost:3000/api/v1
```

## 認証

すべての API リクエストには、Devise トークン認証が必須です：

```
Authorization: Bearer {token}
```

または Cookie ベース認証（セッション）を使用します。

## レスポンス形式

すべてのレスポンスは JSON 形式です：

### 成功レスポンス (200, 201)

```json
{
  "id": 1,
  "name": "Conference Room A",
  "width": 800,
  "height": 600,
  "seats": [...]
}
```

### エラーレスポンス (400, 401, 404, 422)

```json
{
  "error": "エラーメッセージ"
}
```

または

```json
{
  "errors": [
    "フィールド名 エラー内容",
    "フィールド名 エラー内容"
  ]
}
```

## エンドポイント

### ルーム (Rooms)

#### ルーム一覧取得

```
GET /rooms
```

**パラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `q[name_cont]`: ルーム名で検索

**例:**
```bash
curl http://localhost:3000/api/v1/rooms?page=1 \
  -H "Authorization: Bearer {token}"
```

**レスポンス:**
```json
{
  "rooms": [
    {
      "id": 1,
      "name": "Conference Room A",
      "width": 800,
      "height": 600,
      "seats": [...]
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 100
  }
}
```

#### ルーム詳細取得

```
GET /rooms/:id
```

**例:**
```bash
curl http://localhost:3000/api/v1/rooms/1 \
  -H "Authorization: Bearer {token}"
```

**レスポンス:**
```json
{
  "id": 1,
  "name": "Conference Room A",
  "width": 800,
  "height": 600,
  "seats": [
    {
      "id": 1,
      "label": "A-1",
      "x": 100,
      "y": 50,
      "occupied": false,
      "occupant_name": null
    }
  ]
}
```

#### ルーム作成

```
POST /rooms
Content-Type: application/json

{
  "room": {
    "name": "新しいルーム",
    "width": 1000,
    "height": 800
  }
}
```

**例:**
```bash
curl -X POST http://localhost:3000/api/v1/rooms \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "room": {
      "name": "会議室B",
      "width": 1000,
      "height": 800
    }
  }'
```

**レスポンス:** (201 Created)
```json
{
  "id": 2,
  "name": "会議室B",
  "width": 1000,
  "height": 800,
  "seats": []
}
```

### 座席 (Seats)

#### 座席作成

```
POST /rooms/:room_id/seats
Content-Type: application/json

{
  "seat": {
    "label": "A-1",
    "x": 100,
    "y": 50,
    "occupied": false,
    "occupant_name": null
  }
}
```

**例:**
```bash
curl -X POST http://localhost:3000/api/v1/rooms/1/seats \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "seat": {
      "label": "A-1",
      "x": 100,
      "y": 50
    }
  }'
```

#### 座席更新

```
PATCH /rooms/:room_id/seats/:id
Content-Type: application/json

{
  "seat": {
    "occupant_name": "太郎"
  }
}
```

#### チェックイン

```
POST /seats/:id/check_in
Content-Type: application/json

{
  "occupant_name": "太郎"
}
```

**例:**
```bash
curl -X POST http://localhost:3000/api/v1/seats/1/check_in \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"occupant_name": "太郎"}'
```

#### チェックアウト

```
POST /seats/:id/check_out
```

**例:**
```bash
curl -X POST http://localhost:3000/api/v1/seats/1/check_out \
  -H "Authorization: Bearer {token}"
```

### データエクスポート

#### ルームデータ CSV エクスポート

```
GET /rooms/export_csv
```

**例:**
```bash
curl http://localhost:3000/api/v1/rooms/export_csv \
  -H "Authorization: Bearer {token}" \
  -o rooms.csv
```

#### 座席データ CSV エクスポート

```
GET /rooms/:room_id/seats/export_csv
```

**例:**
```bash
curl http://localhost:3000/api/v1/rooms/1/seats/export_csv \
  -H "Authorization: Bearer {token}" \
  -o seats_room_1.csv
```

## エラーコード

| コード | 説明 |
|--------|------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request - 不正なパラメータ |
| 401 | Unauthorized - 認証が必要 |
| 403 | Forbidden - 権限がない |
| 404 | Not Found - リソースが見つからない |
| 422 | Unprocessable Entity - バリデーションエラー |
| 500 | Internal Server Error |

## レート制限

現在、レート制限は実装されていません。本番環境では Rack::Attack の導入を検討してください。

## WebSocket (ActionCable)

リアルタイム更新は WebSocket で配信されます：

```javascript
// ルームの更新を購読
import { subscribeToRoom } from '@/channels/room_channel'

const subscription = subscribeToRoom(roomId, (data) => {
  if (data.type === 'seat_update') {
    console.log('座席更新:', data.seat)
  }
})

// 購読解除
subscription.unsubscribe()
```

## SDK

公式 JavaScript SDK を使用することをお勧めします：

```javascript
import { FloorMapAPI } from '@floormap/sdk'

const api = new FloorMapAPI({
  baseURL: 'http://localhost:3000/api/v1',
  token: 'your_token'
})

// ルーム一覧取得
const rooms = await api.rooms.list()

// ルーム作成
const room = await api.rooms.create({
  name: '会議室C',
  width: 900,
  height: 700
})

// チェックイン
await api.seats.checkIn(seatId, {
  occupant_name: '太郎'
})
```

## 例

### JavaScript (fetch API)

```javascript
// 認証トークン取得（別途実装）
const token = localStorage.getItem('auth_token')

// ルーム一覧取得
fetch('http://localhost:3000/api/v1/rooms', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
})
  .then(r => r.json())
  .then(data => console.log(data))
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# ルーム作成
response = requests.post(
    'http://localhost:3000/api/v1/rooms',
    json={
        'room': {
            'name': '会議室D',
            'width': 1200,
            'height': 900
        }
    },
    headers=headers
)

print(response.json())
```

### cURL

```bash
# ルーム一覧
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/rooms

# ルーム作成
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room":{"name":"E","width":800,"height":600}}' \
  http://localhost:3000/api/v1/rooms
```

## 変更ログ

### v1.0.0
- 初版リリース
- Rooms、Seats、Exports エンドポイント実装
