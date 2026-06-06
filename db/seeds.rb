# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Sample layout seeds for development/demo
room = Room.find_or_create_by!(name: 'Demo Hall') do |r|
	r.width = 800
	r.height = 600
end

# create a simple grid of seats if none exist
if room.seats.count == 0
	cols = 8
	rows = 5
	spacing_x = (room.width / (cols + 1)).to_i
	spacing_y = (room.height / (rows + 1)).to_i
	(0...rows).each do |row|
		(0...cols).each do |col|
			label = "R#{row + 1}C#{col + 1}"
			x = spacing_x * (col + 1)
			y = spacing_y * (row + 1)
			room.seats.create_with(label: label, x: x, y: y, occupied: false).find_or_create_by!(label: label)
		end
	end
end

