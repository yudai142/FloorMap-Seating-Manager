#!/usr/bin/env ruby
# Test script to verify shapes_data implementation

require_relative 'config/environment'

puts "=== Testing Shapes Implementation ==="
puts

# Create test room
room = Room.create!(
  name: "Test Room #{Time.now.to_i}",
  width: 1000,
  height: 800
)
puts "✓ Created test room: #{room.name} (ID: #{room.id})"

# Define test shapes
test_shapes = [
  {
    id: "line-1",
    type: "line",
    x1: 10,
    y1: 20,
    x2: 100,
    y2: 200
  },
  {
    id: "rect-1",
    type: "rectangle",
    x: 50,
    y: 50,
    width: 200,
    height: 150,
    stroke: "blue"
  },
  {
    id: "circle-1",
    type: "circle",
    cx: 300,
    cy: 300,
    r: 50,
    stroke: "red"
  }
]

# Save shapes
room.update(shapes_data: test_shapes)
puts "✓ Saved #{test_shapes.length} shapes to database"
puts "  Shapes: #{test_shapes.map { |s| s[:type] }.join(', ')}"
puts

# Reload from database
room.reload
puts "✓ Reloaded room from database"
puts "  shapes_data type: #{room.shapes_data.class}"
puts "  shapes_data empty?: #{room.shapes_data.empty?}"
puts

# Verify saved shapes
if room.shapes_data == test_shapes
  puts "✅ SUCCESS: Shapes saved and loaded correctly!"
  puts "  Saved shapes match loaded shapes"
elsif room.shapes_data.is_a?(Array) && room.shapes_data.length == test_shapes.length
  puts "✅ PARTIAL: Shapes count matches (#{room.shapes_data.length})"
  puts "  Content:"
  room.shapes_data.each_with_index do |shape, i|
    puts "    [#{i}] type=#{shape['type'] || shape[:type]}, id=#{shape['id']}"
  end
else
  puts "❌ FAILED: Shapes mismatch!"
  puts "  Expected: #{test_shapes.inspect}"
  puts "  Got: #{room.shapes_data.inspect}"
end

puts
puts "=== API Response Test ==="
puts

# Test as_json serialization (used in API responses)
json_response = room.as_json(only: %i[id name width height shapes_data])
puts "API response JSON:"
puts "  - id: #{json_response['id']}"
puts "  - name: #{json_response['name']}"
puts "  - shapes_data: #{json_response['shapes_data'].is_a?(Array) ? "✓ Array" : "✗ Not array"}"
puts "  - shapes count: #{json_response['shapes_data'].length}"

puts
puts "=== Cleanup ==="
room.destroy
puts "✓ Test room deleted"
