class CreateSeats < ActiveRecord::Migration[8.1]
  def change
    create_table :seats do |t|
      t.references :room, null: false, foreign_key: true
      t.string :label, null: false
      t.integer :x, null: false, default: 0
      t.integer :y, null: false, default: 0
      t.boolean :occupied, null: false, default: false

      t.timestamps
    end
  end
end
