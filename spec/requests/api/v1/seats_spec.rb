require 'rails_helper'

RSpec.describe 'Api::V1::Seats', type: :request do
  let(:user) { create(:user) }
  let(:room) { create(:room) }
  let(:seat) { create(:seat, room: room) }
  let(:headers) { { 'CONTENT_TYPE' => 'application/json' } }

  before { sign_in user }

  describe 'POST /api/v1/rooms/:room_id/seats/:id/check_in' do
    it 'marks seat as occupied' do
      expect(seat.occupied).to be false

      post "/api/v1/seats/#{seat.id}/check_in", 
           params: { occupant_name: 'John Doe' }.to_json, 
           headers: headers

      expect(response).to have_http_status(:ok)
      expect(seat.reload.occupied).to be true
      expect(seat.occupant_name).to eq('John Doe')
    end
  end

  describe 'POST /api/v1/seats/:id/check_out' do
    let(:seat) { create(:seat, room: room, occupied: true, occupant_name: 'Jane Doe') }

    it 'marks seat as empty' do
      post "/api/v1/seats/#{seat.id}/check_out", headers: headers

      expect(response).to have_http_status(:ok)
      expect(seat.reload.occupied).to be false
      expect(seat.occupant_name).to be_nil
    end
  end
end
