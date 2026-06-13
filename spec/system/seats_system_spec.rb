require 'rails_helper'

RSpec.describe 'Seats page', type: :system do
  before do
    driven_by :rack_test
  end

  let(:room) { Room.create!(name: 'Conference Room', width: 800, height: 600) }
  let(:seat) { Seat.create!(room: room, label: 'A1', x: 100, y: 100, occupied: false) }

  it 'displays room with empty seats' do
    seat
    visit room_path(room)

    expect(page).to have_content('Conference Room')
    expect(page).to have_content('A1')
    expect(page).to have_content('座席一覧')
  end

  it 'shows seat details with position coordinates' do
    Seat.create!(room: room, label: 'B5', x: 250, y: 300, occupied: false)

    visit room_path(room)
    expect(page).to have_content('B5')
    expect(page).to have_content('(250, 300)')
  end

  it 'displays seat count' do
    Seat.create!(room: room, label: 'A1', x: 100, y: 100)
    Seat.create!(room: room, label: 'A2', x: 150, y: 100)
    Seat.create!(room: room, label: 'A3', x: 200, y: 100)

    visit room_path(room)
    expect(page).to have_content('3 個の座席')
  end

  it 'displays occupied seat with occupant name' do
    occupied_seat = Seat.create!(
      room: room,
      label: 'C2',
      x: 300, y: 250,
      occupied: true,
      occupant_name: 'Yamada'
    )

    visit room_path(room)
    expect(page).to have_content('C2')
    expect(page).to have_content('Yamada')
  end

  it 'shows legend with empty and occupied seat colors' do
    visit room_path(room)
    expect(page).to have_content('空席')
    expect(page).to have_content('着席中')
  end
end
