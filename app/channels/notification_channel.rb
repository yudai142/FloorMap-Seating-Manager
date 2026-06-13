class NotificationChannel < ApplicationCable::Channel
  def subscribed
    if current_user
      stream_for current_user
    else
      reject
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def mark_as_read(data)
    notification = Notification.find(data['notification_id'])
    if notification.user == current_user
      notification.mark_as_read!
      broadcast_to_user(notification, action: 'marked_as_read')
    end
  end

  private

  def broadcast_to_user(notification, action:)
    transmit(
      type: action,
      notification: notification.as_json
    )
  end
end
