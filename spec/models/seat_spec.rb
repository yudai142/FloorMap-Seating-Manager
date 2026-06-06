require 'rails_helper'

RSpec.describe Seat, type: :model do
  it 'has a valid factory' do
    expect(build(:seat)).to be_valid
  end

  it 'is invalid without a label' do
    seat = build(:seat, label: nil)
    expect(seat).not_to be_valid
  end

  it 'validates x and y are integers and non-negative' do
    seat = build(:seat, x: -1, y: -2)
    expect(seat).not_to be_valid
  end

  it 'belongs to a room' do
    seat = create(:seat)
    expect(seat.room).to be_present
  end
end
