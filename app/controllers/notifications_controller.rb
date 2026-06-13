class NotificationsController < ApplicationController
  def index
    @notifications = current_user.notifications.recent.limit(50)
    
    # Inertia render（ページビュー）とJSON レスポンスの両方に対応
    respond_to do |format|
      format.html do
        render inertia: 'Notifications/Index', props: {
          notifications: @notifications.as_json,
          unread_count: current_user.notifications.unread.count
        }
      end
      format.json do
        render json: {
          notifications: @notifications.as_json,
          unread_count: current_user.notifications.unread.count
        }
      end
    end
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

    ActionCable.server.broadcast("user_#{current_user.id}", {
      type: 'notification_read',
      notification: @notification.as_json
    })

    render json: @notification.as_json
  end

  def mark_all_as_read
    current_user.notifications.unread.update_all(read_at: Time.current)

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
