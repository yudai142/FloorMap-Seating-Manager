require 'rails_helper'

RSpec.describe RoomsController, type: :controller do
  describe 'GET #index' do
    it 'returns a success response' do
      get :index
      expect(response).to be_successful
    end

    it 'returns Inertia response' do
      get :index
      expect(response.headers['Content-Type']).to match('application/json')
    end
  end

  describe 'GET #show' do
    let(:room) { create(:room) }

    it 'returns a success response' do
      get :show, params: { id: room.id }
      expect(response).to be_successful
    end

    it 'includes room data' do
      seat = create(:seat, room: room)
      get :show, params: { id: room.id }
      expect(response.body).to include(room.name)
    end
  end

  describe 'POST #create' do
    it 'creates a new Room' do
      expect {
        post :create, params: { room: { name: 'New Room', width: 800, height: 600 } }
      }.to change(Room, :count).by(1)
    end

    it 'redirects to the created room' do
      post :create, params: { room: { name: 'New Room', width: 800, height: 600 } }
      expect(response.status).to eq(303)
    end

    it 'returns error with invalid params' do
      post :create, params: { room: { name: '', width: 800, height: 600 } }
      expect(response.status).to eq(422)
    end
  end
end
