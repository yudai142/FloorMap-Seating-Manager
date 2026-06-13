class Notification < ApplicationRecord
  belongs_to :user

  enum notification_type: { check_in: 'check_in', check_out: 'check_out', seat_update: 'seat_update' }

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  validates :user_id, :notification_type, :title, :message, presence: true

  def unread?
    read_at.nil?
  end

  def mark_as_read!
    update(read_at: Time.current) if unread?
  end

  def self.create_notification(user, notification_type, title, message, data = {})
    create!(
      user: user,
      notification_type: notification_type,
      title: title,
      message: message,
      data: data
    )
  end

  def as_json(options = {})
    super(options.merge(only: [:id, :notification_type, :title, :message, :data, :read_at, :created_at]))
  end
end
