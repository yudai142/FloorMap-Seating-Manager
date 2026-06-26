class GenerateTokensForExistingRooms < ActiveRecord::Migration[8.1]
  def up
    Room.where(token: nil).where.not(user_id: nil).find_each do |room|
      room.update_column(:token, SecureRandom.urlsafe_base64(32))
    end
  end

  def down
    # This migration cannot be safely reversed
    raise ActiveRecord::IrreversibleMigration
  end
end
