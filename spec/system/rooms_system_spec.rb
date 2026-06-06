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
end
