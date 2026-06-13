require 'rails_helper'

RSpec.describe Seat, type: :model do
  describe 'validations' do
    it 'has a valid factory' do
      expect(build(:seat)).to be_valid
    end

    it 'is invalid without a label' do
      seat = build(:seat, label: nil)
      expect(seat).not_to be_valid
    end

    it 'is invalid without x' do
      seat = build(:seat, x: nil)
      expect(seat).not_to be_valid
    end

    it 'is invalid without y' do
      seat = build(:seat, y: nil)
      expect(seat).not_to be_valid
    end

    it 'is invalid with negative x' do
      seat = build(:seat, x: -1)
      expect(seat).not_to be_valid
    end

    it 'is invalid with negative y' do
      seat = build(:seat, y: -1)
      expect(seat).not_to be_valid
    end
  end

  describe 'associations' do
    it 'belongs to a room' do
      seat = create(:seat)
      expect(seat.room).to be_present
    end
  end

  describe '#check_in' do
    let(:seat) { create(:seat) }

    it 'sets occupied to true' do
      seat.update(occupied: true, occupant_name: 'John Doe')
      expect(seat.occupied).to be true
    end

    it 'stores occupant name' do
      seat.update(occupied: true, occupant_name: 'Jane Smith')
      expect(seat.occupant_name).to eq 'Jane Smith'
    end
  end

  describe '#check_out' do
    let(:seat) { create(:seat, occupied: true, occupant_name: 'John Doe') }

    it 'sets occupied to false' do
      seat.update(occupied: false, occupant_name: nil)
      expect(seat.occupied).to be false
    end

    it 'clears occupant name' do
      seat.update(occupied: false, occupant_name: nil)
      expect(seat.occupant_name).to be_nil
    end
  end
end
