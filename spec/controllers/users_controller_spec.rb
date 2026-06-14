require 'rails_helper'

RSpec.describe UsersController, type: :controller do
  let(:user) { create(:user) }

  before { sign_in user }

  describe 'GET #settings' do
    it 'renders Inertia User/Settings component' do
      get :settings

      expect(response).to have_http_status(:ok)
      expect(response).to render_template('settings')
    end

    it 'assigns user data to props' do
      get :settings

      expect(response).to inertia.to include(
        user: be_a(Hash),
        two_factor_enabled: be_in([true, false])
      )
    end

    it 'includes user information in props' do
      get :settings

      user_props = response.parsed_body['props']['user']
      expect(user_props).to include(
        'id' => user.id,
        'email' => user.email,
        'name' => user.name
      )
    end

    context 'when user has 2FA enabled' do
      let(:user) { create(:user, otp_required_for_login: true) }

      it 'sets two_factor_enabled to true' do
        get :settings

        expect(response).to inertia.to include(two_factor_enabled: true)
      end
    end

    context 'when user does not have 2FA enabled' do
      let(:user) { create(:user, otp_required_for_login: false) }

      it 'sets two_factor_enabled to false' do
        get :settings

        expect(response).to inertia.to include(two_factor_enabled: false)
      end
    end
  end

  describe 'authentication requirement' do
    before { sign_out user }

    it 'redirects to sign_in page' do
      get :settings

      expect(response).to redirect_to(new_user_session_path)
    end
  end
end
