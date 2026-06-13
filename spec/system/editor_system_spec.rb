require 'rails_helper'

RSpec.describe 'Editor page', type: :system do
  before do
    driven_by :rack_test
  end

  it 'loads the editor page' do
    Room.create!(name: 'Room A', width: 200, height: 200)
    visit editor_path
    expect(page).to have_content('上面図エディタ')
  end

  it 'displays room and existing seats' do
    room = Room.create!(name: 'Design Studio', width: 600, height: 400)
    Seat.create!(room: room, label: 'S1', x: 100, y: 100)
    Seat.create!(room: room, label: 'S2', x: 200, y: 100)

    visit editor_path(room_id: room.id)
    expect(page).to have_content('Design Studio')
    expect(page).to have_content('600×400')
    expect(page).to have_content('S1')
    expect(page).to have_content('S2')
  end

  it 'shows seat count' do
    room = Room.create!(name: 'Office', width: 500, height: 400)
    Seat.create!(room: room, label: 'Desk1', x: 50, y: 50)
    Seat.create!(room: room, label: 'Desk2', x: 100, y: 50)
    Seat.create!(room: room, label: 'Desk3', x: 150, y: 50)

    visit editor_path(room_id: room.id)
    expect(page).to have_content('3 個の座席')
  end
end
