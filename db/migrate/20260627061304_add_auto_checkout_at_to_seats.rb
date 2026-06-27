class AddAutoCheckoutAtToSeats < ActiveRecord::Migration[8.1]
  def change
    add_column :seats, :auto_checkout_at, :datetime
  end
end
