require 'rails_helper'

RSpec.describe 'Editor page', type: :system do
  before do
    driven_by :rack_test
  end

  it 'loads the editor page' do
    Room.create!(name: 'Room A', width: 200, height: 200)
    visit editor_path
    expect(page).to have_content('SVG Editor')
  end
end
