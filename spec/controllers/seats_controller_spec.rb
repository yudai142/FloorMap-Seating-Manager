require 'rails_helper'

RSpec.describe SeatsController, type: :controller do
  let(:room) { create(:room) }
  let(:seat) { create(:seat, room: room) }

  describe 'POST #create' do
    it 'creates a new Seat' do
      expect {
        post :create, params: {
          room_id: room.id,
          seat: { label: 'S1', x: 100, y: 200 }
        }
      }.to change(Seat, :count).by(1)
    end

    it 'returns JSON response' do
      post :create, params: {
        room_id: room.id,
        seat: { label: 'S1', x: 100, y: 200 }
      }
      expect(response.headers['Content-Type']).to match('application/json')
    end

    it 'returns error with invalid params' do
      post :create, params: {
        room_id: room.id,
        seat: { label: '', x: -1, y: 200 }
      }
      expect(response.status).to eq(422)
    end
  end

  describe 'PATCH #update' do
    it 'updates seat position' do
      patch :update, params: {
        room_id: room.id,
        id: seat.id,
        seat: { x: 300, y: 400 }
      }
      expect(seat.reload.x).to eq(300)
      expect(seat.y).to eq(400)
    end
  end

  describe 'POST #check_in' do
    it 'marks seat as occupied' do
      post :check_in, params: {
        id: seat.id,
        occupant_name: 'John Doe'
      }
      expect(seat.reload.occupied).to be true
    end

    it 'stores occupant name' do
      post :check_in, params: {
        id: seat.id,
        occupant_name: 'Jane Smith'
      }
      expect(seat.reload.occupant_name).to eq('Jane Smith')
    end
  end

  describe 'POST #check_out' do
    let(:occupied_seat) { create(:seat, room: room, occupied: true, occupant_name: 'John Doe') }

    it 'marks seat as unoccupied' do
      post :check_out, params: { id: occupied_seat.id }
      expect(occupied_seat.reload.occupied).to be false
    end

    it 'clears occupant name' do
      post :check_out, params: { id: occupied_seat.id }
      expect(occupied_seat.reload.occupant_name).to be_nil
    end
  end
end
