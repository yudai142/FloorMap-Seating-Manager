class NotificationsController < ApplicationController
  def index
    @notifications = current_user.notifications.recent.limit(50)
    render json: {
      notifications: @notifications.as_json,
      unread_count: current_user.notifications.unread.count
    }
  end

  def unread_count
    render json: {
      unread_count: current_user.notifications.unread.count
    }
  end

  def mark_as_read
    @notification = Notification.find(params[:id])
    authorize @notification, :update?

    @notification.mark_as_read!

    # WebSocket で更新をブロードキャスト
    ActionCable.server.broadcast("user_#{current_user.id}", {
      type: 'notification_read',
      notification: @notification.as_json
    })

    render json: @notification.as_json
  end

  def mark_all_as_read
    current_user.notifications.unread.update_all(read_at: Time.current)

    # WebSocket で更新をブロードキャスト
    ActionCable.server.broadcast("user_#{current_user.id}", {
      type: 'all_notifications_read'
    })

    render json: { success: true }
  end

  def destroy
    @notification = Notification.find(params[:id])
    authorize @notification, :destroy?

    @notification.destroy!

    render json: { success: true }
  end
end
