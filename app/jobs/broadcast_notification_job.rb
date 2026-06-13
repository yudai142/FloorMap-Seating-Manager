class BroadcastNotificationJob
  include Sidekiq::Job
  sidekiq_options retry: 3

  def perform(room_id, type, title, message, data)
    User.find_each do |user|
      # Check user's notification preference
      unless NotificationPreference.enabled_for_user_and_type?(user.id, type)
        next
      end

      notification = Notification.create_notification(user, type, title, message, data)
      ActionCable.server.broadcast("user_#{user.id}", {
        type: 'notification',
        notification: notification.as_json
      })
    end
  end
end
