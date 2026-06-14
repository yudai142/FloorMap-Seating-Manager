class NotificationMailer < ApplicationMailer
  default from: ENV.fetch('MAIL_FROM', 'noreply@floormap.local')

  def seat_notification(user_id, notification_id)
    @user = User.find(user_id)
    @notification = Notification.find(notification_id)
    
    mail(to: @user.email, subject: @notification.title)
  end

  def invitation_email(invitation)
    @invitation = invitation
    mail(to: invitation.email, subject: 'FloorMap Seating Manager へのご招待')
  end
end
