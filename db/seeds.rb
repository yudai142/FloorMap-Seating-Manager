# 管理者ユーザー作成
admin = User.find_or_create_by(email: 'admin@example.com') do |user|
  user.name = '管理者'
  user.role = :admin
  user.password = 'admin123456'
  user.password_confirmation = 'admin123456'
end
puts "✓ 管理者ユーザーを作成: #{admin.email}"

# マネージャーユーザー作成
manager = User.find_or_create_by(email: 'manager@example.com') do |user|
  user.name = 'マネージャー'
  user.role = :manager
  user.password = 'manager123456'
  user.password_confirmation = 'manager123456'
end
puts "✓ マネージャーユーザーを作成: #{manager.email}"

# 通常ユーザー作成
3.times do |i|
  User.find_or_create_by(email: "user#{i + 1}@example.com") do |user|
    user.name = "ユーザー#{i + 1}"
    user.role = :user
    user.password = 'user123456'
    user.password_confirmation = 'user123456'
  end
end
puts "✓ 通常ユーザーを3件作成"

# ルーム作成
rooms_data = [
  { name: '会議室A', width: 800, height: 600 },
  { name: '会議室B', width: 1000, height: 800 },
  { name: 'イベント会場', width: 1600, height: 1200 }
]

rooms_data.each do |room_data|
  room = Room.find_or_create_by(name: room_data[:name]) do |r|
    r.width = room_data[:width]
    r.height = room_data[:height]
  end

  # 座席を生成
  seats_count = 0
  (1..4).each do |row|
    (1..5).each do |col|
      label = "#{row > 2 ? 'B' : 'A'}-#{col}"
      x = col * 150
      y = row * 120
      
      Seat.find_or_create_by(room: room, label: label) do |seat|
        seat.x = x
        seat.y = y
        seat.occupied = [true, false].sample
        seat.occupant_name = seat.occupied ? ['山田太郎', '佐藤花子', '田中次郎'].sample : nil
      end
      seats_count += 1
    end
  end
  puts "✓ ルーム「#{room.name}」を作成（座席数: #{seats_count}）"
end

# バックアップ履歴作成
3.times do |i|
  Backup.find_or_create_by(name: "backup-#{Time.current.strftime('%Y%m%d')}-#{i + 1}") do |backup|
    backup.backup_type = [:automatic, :manual].sample
    backup.description = "テスト用バックアップ #{i + 1}"
    backup.status = [:completed, :pending].sample
    backup.size_bytes = rand(100000000..500000000)
  end
end
puts "✓ バックアップ履歴を3件作成"

# 通知作成
users = User.limit(3)
users.each do |user|
  Notification.find_or_create_by(
    user: user,
    notification_type: :seat_update,
    title: "座席が更新されました"
  ) do |notif|
    notif.message = "座席Aの状態が変更されました"
    notif.read_at = [nil, 1.hour.ago].sample
  end
end
puts "✓ 通知を3件作成"

puts "\n🎉 データベースシードの初期化が完了しました！"
puts "デフォルトログイン情報:"
puts "  - Admin: admin@example.com / admin123456"
puts "  - Manager: manager@example.com / manager123456"
puts "  - User: user1@example.com / user123456"
