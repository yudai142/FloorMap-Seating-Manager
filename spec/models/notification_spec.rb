require 'rails_helper'

RSpec.describe Notification, type: :model do
  let(:user) { create(:user) }
  let(:notification) { create(:notification, user:, notification_type: 'seat_update') }

  describe 'associations' do
    it { is_expected.to belong_to(:user) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:user_id) }
    it { is_expected.to validate_presence_of(:notification_type) }
    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_presence_of(:message) }
    it { is_expected.to validate_inclusion_of(:notification_type).in_array(Notification::NOTIFICATION_TYPES) }
  end

  describe '#mark_as_read!' do
    context 'when notification is unread' do
      it 'sets read_at to current time' do
        expect(notification.read_at).to be_nil
        notification.mark_as_read!
        expect(notification.read_at).to be_present
      end
    end

    context 'when notification is already read' do
      let(:notification) { create(:notification, user:, read_at: 1.hour.ago) }

      it 'keeps the original read_at' do
        original_read_at = notification.read_at
        notification.mark_as_read!
        expect(notification.read_at).to be_within(1.second).of(original_read_at)
      end
    end
  end

  describe '#unread?' do
    context 'when notification is unread' do
      it 'returns true' do
        expect(notification.unread?).to be true
      end
    end

    context 'when notification is read' do
      let(:notification) { create(:notification, user:, read_at: 1.hour.ago) }

      it 'returns false' do
        expect(notification.unread?).to be false
      end
    end
  end

  describe 'scopes' do
    let!(:recent_notification) { create(:notification, user:, created_at: 1.minute.ago) }
    let!(:old_notification) { create(:notification, user:, created_at: 1.day.ago) }
    let!(:unread_notification) { create(:notification, user:, read_at: nil) }
    let!(:read_notification) { create(:notification, user:, read_at: 1.hour.ago) }

    describe '.recent' do
      it 'returns notifications in reverse creation order' do
        expect(user.notifications.recent).to start_with(recent_notification)
      end
    end

    describe '.unread' do
      it 'returns only unread notifications' do
        expect(user.notifications.unread).to include(unread_notification)
        expect(user.notifications.unread).not_to include(read_notification)
      end
    end
  end
end
