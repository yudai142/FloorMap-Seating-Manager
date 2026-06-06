class CreateRooms < ActiveRecord::Migration[8.1]
  def change
    create_table :rooms do |t|
      t.string :name, null: false
      t.integer :width, default: 0, null: false
      t.integer :height, default: 0, null: false

      t.timestamps
    end
  end
end
