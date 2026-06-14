require 'rails_helper'

RSpec.describe NotificationsController, type: :controller do
  let(:user) { create(:user) }
  let(:notification) { create(:notification, user:) }

  before { sign_in user }

  describe 'GET #index' do
    let!(:notifications) { create_list(:notification, 3, user:) }

    context 'with HTML request' do
      it 'renders Inertia Notifications/Index component' do
        get :index

        expect(response).to have_http_status(:ok)
        expect(response).to render_template('index')
      end

      it 'assigns notifications to props' do
        get :index

        expect(response).to inertia.to include(
          notifications: anything,
          unread_count: anything
        )
      end
    end

    context 'with JSON request' do
      it 'returns JSON response' do
        get :index, format: :json

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include('application/json')
        expect(JSON.parse(response.body)).to include(
          'notifications' => be_an(Array),
          'unread_count' => be_an(Integer)
        )
      end
    end
  end

  describe 'GET #unread_count' do
    let!(:read_notification) { create(:notification, user:, read_at: 1.hour.ago) }
    let!(:unread_notification) { create(:notification, user:, read_at: nil) }

    it 'returns JSON with unread count' do
      get :unread_count

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['unread_count']).to eq(1)
    end
  end

  describe 'PATCH #mark_as_read' do
    it 'marks notification as read' do
      expect(notification.unread?).to be true

      patch :mark_as_read, params: { id: notification.id }

      expect(notification.reload.unread?).to be false
    end

    it 'returns JSON response' do
      patch :mark_as_read, params: { id: notification.id }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to include('id' => notification.id)
    end
  end

  describe 'PATCH #mark_all_as_read' do
    let!(:unread_notifications) { create_list(:notification, 3, user:, read_at: nil) }

    it 'marks all unread notifications as read' do
      expect(user.notifications.unread.count).to eq(3)

      patch :mark_all_as_read

      expect(user.notifications.reload.unread.count).to eq(0)
    end

    it 'returns success JSON' do
      patch :mark_all_as_read

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['success']).to be true
    end
  end

  describe 'DELETE #destroy' do
    it 'deletes notification' do
      expect(Notification.find_by(id: notification.id)).to be_present

      delete :destroy, params: { id: notification.id }

      expect(Notification.find_by(id: notification.id)).to be_nil
    end

    it 'returns success JSON' do
      delete :destroy, params: { id: notification.id }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['success']).to be true
    end
  end
end
