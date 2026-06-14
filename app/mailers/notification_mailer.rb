class NotificationMailer < ApplicationMailer
  def seat_notification(user_id, notification_id)
    @user = User.find(user_id)
    @notification = Notification.find(notification_id)
    mail(to: @user.email, subject: @notification.title)
  end
end
