source "https://rubygems.org"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.1.3"
# The modern asset pipeline for Rails [https://github.com/rails/propshaft]
gem "propshaft"
# Use postgresql as the database for Active Record
gem "pg", "~> 1.1"
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", ">= 5.0"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Use the database-backed adapters for Rails.cache, Active Job, and Action Cable
# (Replaced with Sidekiq for background jobs)

# Inertia.js for Rails
gem "inertia_rails"

# Vite for front-end bundling
gem "vite_ruby"

# Authentication
gem "devise"
gem "devise-i18n"

# Authorization
gem "pundit"

# Background Jobs
gem "sidekiq"

# Rate limiting
gem "rack-attack"

# AWS SDK
gem "aws-sdk-s3"

# Backup utilities

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Deploy this application anywhere as a Docker container [https://kamal-deploy.org]
gem "kamal", require: false

# Add HTTP asset caching/compression and X-Sendfile acceleration to Puma [https://github.com/basecamp/thruster/]
gem "thruster", require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem "image_processing", "~> 2.0"

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"

  # Audits gems for known security defects (use config/bundler-audit.yml to ignore issues)
  gem "bundler-audit", require: false
  gem "faker"

  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem "brakeman", require: false

  # Omakase Ruby styling [https://github.com/rails/rubocop-rails-omakase/]
  gem "rubocop-rails-omakase", require: false

  # Testing
  gem "rspec-rails"
  gem "factory_bot_rails"

  # API Documentation
  gem "rswag-api"
  gem "rswag-ui"
  gem "rswag-specs"

  # Test Coverage Report
  gem "simplecov", require: false
end

group :development do
  # Use console on exceptions pages [https://github.com/rails/web-console]
  gem "web-console"

  # N+1 query detection
  gem "bullet"

  # Performance profiling
  gem "rack-mini-profiler"
  gem "memory_profiler"
  gem "stackprof"
end

group :test do
  # Use system testing [https://guides.rubyonrails.org/testing.html#system-testing]
  gem "capybara"
  gem "selenium-webdriver"
end

# Pagination
gem "kaminari"

# Search
gem "ransack"

# Audit Trail
gem "paper_trail"

# Admin Dashboard
gem "rails_admin"

# Two-Factor Authentication (needed in all environments)
gem "devise-two-factor"
gem "rqrcode"

group :production do
  # Error tracking
  gem "sentry-ruby"
  gem "sentry-rails"

  # Caching
  gem "redis"
end
gem "lograge"
