class AddPerformanceIndexes < ActiveRecord::Migration[8.0]
  def change
    add_index :seats, [:room_id, :occupied] unless index_exists?(:seats, [:room_id, :occupied])
    add_index :notifications, [:user_id, :read_at] unless index_exists?(:notifications, [:user_id, :read_at])
    add_index :notifications, :created_at unless index_exists?(:notifications, :created_at)
    add_index :versions, [:item_type, :item_id] unless index_exists?(:versions, [:item_type, :item_id])
  end
end
