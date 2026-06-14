require 'rails_helper'

RSpec.describe User, type: :model do
  let(:user) { create(:user) }

  describe 'associations' do
    it { is_expected.to have_many(:notifications).dependent(:destroy) }
    it { is_expected.to have_many(:notification_preferences).dependent(:destroy) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
  end

  describe 'roles' do
    let(:user_role) { create(:user, role: :user) }
    let(:manager_role) { create(:user, role: :manager) }
    let(:admin_role) { create(:user, role: :admin) }

    describe '#admin?' do
      it 'returns true for admin role' do
        expect(admin_role.admin?).to be true
      end

      it 'returns false for non-admin roles' do
        expect(user_role.admin?).to be false
        expect(manager_role.admin?).to be false
      end
    end

    describe '#manager?' do
      it 'returns true for manager role' do
        expect(manager_role.manager?).to be true
      end

      it 'returns true for admin role' do
        expect(admin_role.manager?).to be true
      end

      it 'returns false for user role' do
        expect(user_role.manager?).to be false
      end
    end
  end

  describe '#display_name' do
    it 'returns user name' do
      expect(user.display_name).to eq(user.name)
    end
  end

  describe '#as_json' do
    subject { user.as_json }

    it 'includes user attributes' do
      expect(subject).to include(
        'id' => user.id,
        'email' => user.email,
        'name' => user.name,
        'role' => user.role,
        'created_at' => anything
      )
    end

    it 'does not include password' do
      expect(subject).not_to include('encrypted_password')
    end
  end

  describe 'two_factor_authenticatable' do
    context 'when 2FA is not enabled' do
      let(:user) { create(:user, otp_required_for_login: false) }

      it 'otp_required_for_login is false' do
        expect(user.otp_required_for_login).to be false
      end
    end

    context 'when 2FA is enabled' do
      let(:user) { create(:user, otp_required_for_login: true) }

      it 'otp_required_for_login is true' do
        expect(user.otp_required_for_login).to be true
      end

      it 'has_one_time_password is available' do
        expect(user).to respond_to(:generate_totp_secret)
        expect(user).to respond_to(:validate_and_consume_otp!)
      end
    end
  end
end
