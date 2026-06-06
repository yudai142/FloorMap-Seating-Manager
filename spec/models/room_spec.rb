require 'rails_helper'

RSpec.describe Room, type: :model do
  it 'has a valid factory' do
    expect(build(:room)).to be_valid
  end

  it 'is invalid without a name' do
    room = build(:room, name: nil)
    expect(room).not_to be_valid
  end

  it 'can have many seats' do
    room = create(:room)
    create_list(:seat, 3, room: room)
    expect(room.seats.count).to eq 3
  end
end
