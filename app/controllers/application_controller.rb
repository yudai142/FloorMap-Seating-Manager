class ApplicationController < ActionController::Base
  include InertiaRails::Controller
  include Pundit::Authorization

  before_action :authenticate_user!
  before_action :set_current_user_in_inertia

  rescue_from Pundit::NotAuthorizedError,       with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound,       with: :not_found
  rescue_from ActionController::ParameterMissing, with: :bad_request

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

  def not_found(exception)
    respond_to do |format|
      format.json { render json: { error: '見つかりません' }, status: :not_found }
      format.html { render inertia: 'Errors/NotFound', status: :not_found }
    end
  end

  def bad_request(exception)
    respond_to do |format|
      format.json { render json: { error: exception.message }, status: :bad_request }
      format.html { render inertia: 'Errors/BadRequest', status: :bad_request }
    end
  end
end
