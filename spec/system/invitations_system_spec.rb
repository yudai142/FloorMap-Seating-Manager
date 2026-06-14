require 'rails_helper'

RSpec.describe 'Invitations', type: :system do
  let(:admin) { create(:user, :admin) }
  let(:user) { create(:user) }

  describe 'Admin sends invitation' do
    before do
      sign_in admin
      visit root_path
    end

    it 'creates and sends an invitation' do
      visit invitations_path

      fill_in 'email', with: 'newuser@example.com'
      select 'user', from: 'role'

      click_button 'Send Invitation'

      expect(Invitation.last.email).to eq('newuser@example.com')
      expect(page).to have_content('Invitation sent')
    end

    it 'displays list of pending invitations' do
      create(:invitation, email: 'pending@example.com', invited_by: admin)

      visit invitations_path

      expect(page).to have_content('pending@example.com')
      expect(page).to have_content('Pending')
    end

    it 'allows deletion of invitation' do
      invitation = create(:invitation, invited_by: admin)

      visit invitations_path
      click_button 'Delete'

      expect(Invitation.find_by(id: invitation.id)).to be_nil
    end
  end

  describe 'User accepts invitation' do
    let(:invitation) { create(:invitation, email: 'invited@example.com') }

    it 'creates account from invitation link' do
      visit "/invitations/#{invitation.token}/accept"

      expect(page).to have_button('Create Account')

      fill_in 'name', with: 'New User'
      fill_in 'password', with: 'SecurePass123!'
      fill_in 'password_confirmation', with: 'SecurePass123!'

      click_button 'Create Account'

      expect(page).to have_content('Account created successfully')

      new_user = User.find_by(email: 'invited@example.com')
      expect(new_user).not_to be_nil
      expect(new_user.name).to eq('New User')
    end

    it 'prevents using expired invitation' do
      expired_invitation = create(:invitation, :expired)

      visit "/invitations/#{expired_invitation.token}/accept"

      expect(page).to have_content('This invitation has expired')
    end

    it 'signs user in after account creation' do
      visit "/invitations/#{invitation.token}/accept"

      fill_in 'name', with: 'New User'
      fill_in 'password', with: 'SecurePass123!'
      fill_in 'password_confirmation', with: 'SecurePass123!'

      click_button 'Create Account'

      visit root_path
      expect(page).not_to have_button('Sign In')
      expect(page).to have_button('Sign Out')
    end
  end
end
