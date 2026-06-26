class CreateRoomPermissions < ActiveRecord::Migration[8.1]
  def change
    create_table :room_permissions do |t|
      t.references :room, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :room_permissions, [:room_id, :user_id], unique: true
  end
end
