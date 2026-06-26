class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: [:update]

  def settings
    @user = current_user
    render inertia: 'User/Settings', props: {
      user: @user.as_json,
      two_factor_enabled: @user.otp_required_for_login
    }
  end

  def update
    if @user.update(user_params)
      render json: { message: 'ユーザー情報を更新しました' }, status: :ok
    else
      render json: { errors: @user.errors.messages }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = User.find(params[:id])
    authorize_user!
  end

  def authorize_user!
    unless current_user.id == @user.id
      render json: { error: '権限がありません' }, status: :forbidden
    end
  end

  def user_params
    params.require(:user).permit(:name)
  end
end
