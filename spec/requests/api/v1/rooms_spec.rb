require 'rails_helper'

RSpec.describe 'Api::V1::Rooms', type: :request do
  let(:user) { create(:user) }
  let(:headers) { { 'CONTENT_TYPE' => 'application/json' } }

  before { sign_in user }

  describe 'GET /api/v1/rooms' do
    let!(:rooms) { create_list(:room, 3) }

    it 'returns list of rooms' do
      get '/api/v1/rooms', headers: headers

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to include(
        'rooms' => be_an(Array),
        'pagination' => be_a(Hash)
      )
    end

    it 'returns pagination data' do
      get '/api/v1/rooms', headers: headers

      pagination = JSON.parse(response.body)['pagination']
      expect(pagination).to include(
        'current_page' => be_an(Integer),
        'total_pages' => be_an(Integer),
        'total_count' => be_an(Integer)
      )
    end
  end

  describe 'GET /api/v1/rooms/:id' do
    let(:room) { create(:room) }

    it 'returns room details with seats' do
      create_list(:seat, 3, room: room)

      get "/api/v1/rooms/#{room.id}", headers: headers

      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data).to include(
        'id' => room.id,
        'name' => room.name,
        'seats' => be_an(Array)
      )
    end
  end

  describe 'POST /api/v1/rooms' do
    let(:room_params) do
      {
        room: { name: 'New Room', width: 800, height: 600 }
      }
    end

    it 'creates a new room' do
      expect {
        post '/api/v1/rooms', params: room_params.to_json, headers: headers
      }.to change(Room, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end
end
