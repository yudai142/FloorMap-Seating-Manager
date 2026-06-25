class AddUserIdToRooms < ActiveRecord::Migration[8.1]
  def change
    add_reference :rooms, :user, foreign_key: true
    add_index :rooms, :user_id
  end
end
