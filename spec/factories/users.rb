FactoryBot.define do
  factory :user do
    email { Faker::Internet.email }
    password { 'Password123!' }
    password_confirmation { 'Password123!' }
    name { Faker::Name.name }
    role { 0 }

    trait :admin do
      role { 2 }
    end

    trait :manager do
      role { 1 }
    end

    trait :with_2fa do
      otp_required_for_login { true }
      otp_secret { ROTP::Base32.random_base32 }
    end
  end
end
