class ApplicationController < ActionController::Base
  include InertiaRails::Controller
  include Pundit::Authorization

  before_action :authenticate_user!
  before_action :set_current_user_in_inertia

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  allow_browser versions: :modern

  private

  def set_current_user_in_inertia
    inertia_share(
      auth: {
        user: current_user&.as_json,
        is_admin: current_user&.admin?,
        is_manager: current_user&.manager?
      }
    )
  end

  def user_not_authorized
    redirect_to root_path, alert: 'アクセス権限がありません'
  end
end
