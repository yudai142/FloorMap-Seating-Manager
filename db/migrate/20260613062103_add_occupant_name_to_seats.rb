class AddOccupantNameToSeats < ActiveRecord::Migration[8.1]
  def change
    add_column :seats, :occupant_name, :string
  end
end
