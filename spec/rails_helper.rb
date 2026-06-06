ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort('The Rails environment is running in production mode!') if Rails.env.production?

require 'spec_helper'
require 'rspec/rails'

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  puts e.to_s.strip
  exit 1
end

RSpec.configure do |config|
  # rspec-rails が正しくロードされていない環境で
  # `fixture_path=` が未定義だと NoMethodError になるため保護する
  if config.respond_to?(:fixture_path=)
    config.fixture_path = "#{::Rails.root}/spec/fixtures"
  end

  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
end
