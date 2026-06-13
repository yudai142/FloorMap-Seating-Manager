class Room < ApplicationRecord
  has_many :seats, dependent: :destroy
  has_paper_trail
  has_one_attached :floor_plan_image

  validates :name, presence: true
  validates :width,  numericality: { only_integer: true, greater_than: 0 }
  validates :height, numericality: { only_integer: true, greater_than: 0 }
end
