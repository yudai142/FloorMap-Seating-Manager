class UsersController < ApplicationController
  before_action :authenticate_user!

  def settings
    @user = current_user
    render inertia: 'User/Settings', props: {
      user: @user.as_json,
      two_factor_enabled: @user.otp_required_for_login
    }
  end
end
