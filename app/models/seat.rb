class Seat < ApplicationRecord
  belongs_to :room

  validates :label, presence: true
  validates :x, :y, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
