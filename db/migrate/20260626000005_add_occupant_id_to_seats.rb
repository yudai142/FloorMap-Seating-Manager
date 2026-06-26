class AddOccupantIdToSeats < ActiveRecord::Migration[8.1]
  def change
    add_column :seats, :occupant_id, :integer
    add_foreign_key :seats, :users, column: :occupant_id, on_delete: :nullify
  end
end
