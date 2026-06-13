class TwoFactorController < ApplicationController
  before_action :authenticate_user!

  def setup
    @user = current_user
    if @user.otp_secret.blank?
      @user.generate_totp_secret
    end
    render inertia: 'Auth/TwoFactorSetup', props: {
      qr_code: generate_qr_code(@user),
      secret: @user.otp_secret
    }
  end

  def confirm
    @user = current_user
    if @user.validate_and_consume_otp!(params[:otp_code])
      @user.update(otp_required_for_login: true)
      redirect_to root_path, notice: '二要素認証が有効化されました'
    else
      redirect_to two_factor_setup_path, alert: '無効なコードです。もう一度お試しください。'
    end
  end

  def disable
    @user = current_user
    @user.update(otp_required_for_login: false, otp_secret: nil)
    redirect_to root_path, notice: '二要素認証が無効化されました'
  end

  private

  def generate_qr_code(user)
    require 'rqrcode'
    qr = RQRCode.encode(user.otp_provisioning_uri(user.email, issuer: 'FloorMap'), level: :h, mode: :byte)
    qr.as_svg(size: 200).html_safe
  end
end
