ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort('The Rails environment is running in production mode!') if Rails.env.production?

require 'spec_helper'
require 'rspec/rails'
require 'factory_bot_rails'
require 'capybara/rails'
require 'selenium-webdriver'

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  puts e.to_s.strip
  exit 1
end

RSpec.configure do |config|
  if config.respond_to?(:fixture_path=)
    config.fixture_path = "#{::Rails.root}/spec/fixtures"
  end

  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!

  # Factory Bot
  config.include FactoryBot::Syntax::Methods

  # Devise helpers for system tests
  config.include Devise::Test::IntegrationHelpers, type: :system
  config.include Devise::Test::IntegrationHelpers, type: :request

  # Capybara driver
  Capybara.default_driver = :selenium_chrome_headless
  Capybara.javascript_driver = :selenium_chrome_headless
end
