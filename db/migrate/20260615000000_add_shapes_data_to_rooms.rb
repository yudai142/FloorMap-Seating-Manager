class AddShapesDataToRooms < ActiveRecord::Migration[8.1]
  def change
    add_column :rooms, :shapes_data, :jsonb, default: []
  end
end
