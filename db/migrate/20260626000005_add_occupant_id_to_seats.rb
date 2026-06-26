class AddOccupantIdToSeats < ActiveRecord::Migration[8.1]
  def up
    add_column :seats, :occupant_id, :integer unless column_exists?(:seats, :occupant_id)

    # Add foreign key if it doesn't exist
    unless foreign_key_exists?(:seats, :users, column: :occupant_id)
      add_foreign_key :seats, :users, column: :occupant_id, on_delete: :nullify
    end
  end

  def down
    if foreign_key_exists?(:seats, :users, column: :occupant_id)
      remove_foreign_key :seats, :users, column: :occupant_id
    end
    remove_column :seats, :occupant_id if column_exists?(:seats, :occupant_id)
  end
end
