FactoryBot.define do
  factory :notification do
    user { create(:user) }
    notification_type { 'check_in' }
    title { 'Check-in Notification' }
    message { 'Someone has checked in' }
    data { {} }
    read_at { nil }

    trait :unread do
      read_at { nil }
    end

    trait :read do
      read_at { Time.current }
    end

    trait :check_in do
      notification_type { 'check_in' }
      title { 'Check-in' }
    end

    trait :check_out do
      notification_type { 'check_out' }
      title { 'Check-out' }
    end

    trait :seat_update do
      notification_type { 'seat_update' }
      title { 'Seat Update' }
    end
  end
end
