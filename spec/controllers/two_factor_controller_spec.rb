require 'rails_helper'

RSpec.describe TwoFactorController, type: :controller do
  let(:user) { create(:user) }

  before { sign_in user }

  describe 'GET #setup' do
    it 'renders Inertia Auth/TwoFactorSetup component' do
      get :setup

      expect(response).to have_http_status(:ok)
      expect(response).to render_template('setup')
    end

    it 'generates OTP secret if not present' do
      expect(user.otp_secret).to be_nil

      get :setup

      expect(user.reload.otp_secret).to be_present
    end

    it 'assigns qr_code and secret to props' do
      get :setup

      expect(response).to inertia.to include(
        qr_code: be_a(String),
        secret: be_a(String)
      )
    end
  end

  describe 'POST #confirm' do
    before { user.generate_totp_secret }

    context 'with valid OTP code' do
      it 'enables 2FA' do
        expect(user.otp_required_for_login).to be false

        code = user.current_otp
        post :confirm, params: { otp_code: code }

        expect(user.reload.otp_required_for_login).to be true
      end

      it 'redirects to root path' do
        code = user.current_otp
        post :confirm, params: { otp_code: code }

        expect(response).to redirect_to(root_path)
      end
    end

    context 'with invalid OTP code' do
      it 'does not enable 2FA' do
        post :confirm, params: { otp_code: '000000' }

        expect(user.reload.otp_required_for_login).to be false
      end

      it 'redirects to setup page' do
        post :confirm, params: { otp_code: '000000' }

        expect(response).to redirect_to(two_factor_setup_path)
      end
    end
  end

  describe 'DELETE #disable' do
    let(:user) { create(:user, otp_required_for_login: true) }

    it 'disables 2FA' do
      expect(user.otp_required_for_login).to be true

      delete :disable

      expect(user.reload.otp_required_for_login).to be false
    end

    it 'clears OTP secret' do
      delete :disable

      expect(user.reload.otp_secret).to be_nil
    end

    it 'redirects to root path' do
      delete :disable

      expect(response).to redirect_to(root_path)
    end
  end

  describe 'authentication requirement' do
    before { sign_out user }

    it 'redirects to sign_in page' do
      get :setup

      expect(response).to redirect_to(new_user_session_path)
    end
  end
end
