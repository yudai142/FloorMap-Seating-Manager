class Room < ApplicationRecord
  belongs_to :user
  has_many :seats, dependent: :destroy
  has_paper_trail
  has_one_attached :floor_plan_image do |attachable|
    attachable.variant :thumb, resize_to_limit: [200, 200]
    attachable.variant :preview, resize_to_limit: [800, 600]
  end

  validates :name, presence: true
  validates :width,  numericality: { only_integer: true, greater_than: 0 }
  validates :height, numericality: { only_integer: true, greater_than: 0 }
end
