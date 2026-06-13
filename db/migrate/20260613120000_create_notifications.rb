class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :notification_type, null: false  # check_in, check_out, seat_update
      t.string :title, null: false
      t.text :message, null: false
      t.jsonb :data, default: {}
      t.datetime :read_at

      t.timestamps
    end

    add_index :notifications, [:user_id, :created_at]
    add_index :notifications, [:user_id, :read_at]
  end
end
