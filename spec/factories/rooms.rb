FactoryBot.define do
  factory :room do
    sequence(:name) { |n| "Room \\#{n}" }
    width { 800 }
    height { 600 }
  end
end
