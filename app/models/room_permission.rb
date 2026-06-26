class RoomPermission < ApplicationRecord
  belongs_to :room
  belongs_to :user

  validates :room_id, :user_id, presence: true
  validates :user_id, uniqueness: { scope: :room_id }
end
