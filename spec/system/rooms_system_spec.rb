require 'rails_helper'

RSpec.describe 'Rooms page', type: :system do
  before do
    driven_by :rack_test
  end

  it 'shows rooms index' do
    Room.create!(name: 'Test Room', width: 400, height: 300)
    visit root_path
    expect(page).to have_content('Rooms')
    expect(page).to have_content('Test Room')
  end

  it 'shows room details' do
    room = Room.create!(name: 'Meeting Room', width: 800, height: 600)
    Seat.create!(room: room, label: 'A1', x: 50, y: 50)
    Seat.create!(room: room, label: 'A2', x: 100, y: 50)

    visit room_path(room)
    expect(page).to have_content('Meeting Room')
    expect(page).to have_content('800 × 600')
    expect(page).to have_content('A1')
    expect(page).to have_content('A2')
  end

  it 'creates a room successfully' do
    visit root_path
    expect {
      fill_in '上面図の名前', with: 'New Meeting Room'
      fill_in '幅 (px)', with: '1000'
      fill_in '高さ (px)', with: '800'
      click_button '作成'
    }.to change(Room, :count).by(1)

    expect(page).to have_content('New Meeting Room')
  end

  it 'shows validation error for empty name' do
    visit root_path
    fill_in '幅 (px)', with: '800'
    fill_in '高さ (px)', with: '600'
    click_button '作成'

    expect(page).to have_content('エラー')
  end
end
