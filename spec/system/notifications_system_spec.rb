require 'rails_helper'

RSpec.describe 'Notifications', type: :system do
  let(:user) { create(:user) }
  let(:admin) { create(:user, :admin) }

  before do
    sign_in user
    visit root_path
  end

  describe 'Notification display' do
    it 'displays unread notifications badge' do
      create_list(:notification, 3, :unread, user: user)

      visit notifications_path

      expect(page).to have_content('Notifications')
      expect(page).to have_selector('[data-test="notification-count"]')
    end

    it 'marks notification as read' do
      notification = create(:notification, :unread, user: user)

      visit notifications_path
      expect(page).to have_content(notification.title)

      click_button 'Mark as read'

      notification.reload
      expect(notification.read_at).not_to be_nil
    end

    it 'marks all notifications as read' do
      create_list(:notification, 5, :unread, user: user)

      visit notifications_path

      click_button 'Mark all as read'

      expect(user.notifications.where(read_at: nil).count).to eq(0)
    end

    it 'deletes a notification' do
      notification = create(:notification, user: user)

      visit notifications_path
      expect(page).to have_content(notification.title)

      click_button 'Delete'

      expect(user.notifications.count).to eq(0)
    end
  end

  describe 'Notification preferences' do
    it 'allows user to configure notification preferences' do
      visit user_settings_path

      expect(page).to have_selector('input[type="checkbox"]')

      check 'notification_check_in'

      click_button 'Save'

      pref = user.notification_preferences.find_by(notification_type: 'check_in')
      expect(pref.enabled).to be true
    end
  end
end
