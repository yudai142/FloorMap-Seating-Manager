class Seat < ApplicationRecord
  belongs_to :room

  has_paper_trail
  validates :label, presence: true
  validates :x, :y, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :occupant_name, length: { maximum: 100 }, allow_blank: true
end
