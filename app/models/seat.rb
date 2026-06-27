class Seat < ApplicationRecord
  belongs_to :room
  belongs_to :occupant, class_name: 'User', optional: true, foreign_key: :occupant_id

  has_paper_trail
  validates :label, presence: true
  validates :x, :y, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :occupant_name, length: { maximum: 100 }, allow_blank: true
  validates :auto_checkout_at, presence: false

  def has_auto_checkout?
    auto_checkout_at.present? && auto_checkout_at > Time.current
  end

  def auto_checkout_time_formatted
    return nil unless auto_checkout_at
    auto_checkout_at.strftime('%H:%M')
  end

  def schedule_auto_checkout
    return if auto_checkout_at.blank?
    AutoCheckoutJob.set(wait_until: auto_checkout_at).perform_later(id)
  end
end
