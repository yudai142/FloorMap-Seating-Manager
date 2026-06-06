class Room < ApplicationRecord
  has_many :seats, dependent: :destroy

  validates :name, presence: true
end
