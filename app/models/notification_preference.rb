class NotificationPreference < ApplicationRecord
  belongs_to :user

  validates :notification_type, presence: true, uniqueness: { scope: :user_id }
  validates :enabled, inclusion: { in: [true, false] }

  NOTIFICATION_TYPES = %w[check_in check_out seat_update].freeze

  validates :notification_type, inclusion: { in: NOTIFICATION_TYPES }

  def self.enabled_for_user_and_type?(user_id, notification_type)
    find_by(user_id: user_id, notification_type: notification_type)&.enabled? || true
  end
end
