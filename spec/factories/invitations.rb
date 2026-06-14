FactoryBot.define do
  factory :invitation do
    email { Faker::Internet.email }
    token { SecureRandom.hex(16) }
    role { 0 }
    invited_by { create(:user, :admin) }
    expires_at { 7.days.from_now }
    accepted_at { nil }

    trait :pending do
      accepted_at { nil }
    end

    trait :accepted do
      accepted_at { Time.current }
    end

    trait :expired do
      expires_at { 1.day.ago }
    end
  end
end
