require 'rails_helper'

RSpec.describe Room, type: :model do
  describe 'validations' do
    it 'has a valid factory' do
      expect(build(:room)).to be_valid
    end

    it 'is invalid without a name' do
      room = build(:room, name: nil)
      expect(room).not_to be_valid
    end

    it 'is invalid without width' do
      room = build(:room, width: nil)
      expect(room).not_to be_valid
    end

    it 'is invalid without height' do
      room = build(:room, height: nil)
      expect(room).not_to be_valid
    end

    it 'is invalid with width <= 0' do
      room = build(:room, width: 0)
      expect(room).not_to be_valid
    end

    it 'is invalid with height <= 0' do
      room = build(:room, height: 0)
      expect(room).not_to be_valid
    end
  end

  describe 'associations' do
    it 'can have many seats' do
      room = create(:room)
      create_list(:seat, 3, room: room)
      expect(room.seats.count).to eq 3
    end

    it 'destroys seats when room is destroyed' do
      room = create(:room)
      create_list(:seat, 3, room: room)
      expect { room.destroy }.to change { Seat.count }.by(-3)
    end
  end

  describe '#as_json' do
    let(:room) { create(:room) }

    it 'includes id, name, width, height' do
      json = room.as_json
      expect(json).to include('id', 'name', 'width', 'height')
    end
  end
end
