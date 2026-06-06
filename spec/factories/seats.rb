FactoryBot.define do
  factory :seat do
    association :room
    sequence(:label) { |n| "A#{n}" }
    x { 0 }
    y { 0 }
    occupied { false }
  end
end
