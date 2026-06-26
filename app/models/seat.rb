class Seat < ApplicationRecord
  belongs_to :room
  belongs_to :occupant, class_name: 'User', optional: true, foreign_key: :occupant_id

  has_paper_trail
  validates :label, presence: true
  validates :x, :y, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :occupant_name, length: { maximum: 100 }, allow_blank: true
end
