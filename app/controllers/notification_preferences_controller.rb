class NotificationPreferencesController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_preference_exists, only: [:update]

  def index
    preferences = current_user.notification_preferences.index_by(&:notification_type)
    notification_types = NotificationPreference::NOTIFICATION_TYPES

    prefs_data = notification_types.map do |type|
      pref = preferences[type] || current_user.notification_preferences.build(notification_type: type, enabled: true)
      {
        notification_type: pref.notification_type,
        enabled: pref.enabled?
      }
    end

    render json: { preferences: prefs_data }
  end

  def update
    @preference = current_user.notification_preferences.find_by(notification_type: preference_params[:notification_type])

    if @preference.update(preference_params)
      render json: { preference: @preference.as_json }, status: :ok
    else
      render json: { errors: @preference.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def ensure_preference_exists
    notification_type = preference_params[:notification_type]
    current_user.notification_preferences.find_or_create_by(notification_type: notification_type)
  end

  def preference_params
    params.permit(:notification_type, :enabled)
  end
end
