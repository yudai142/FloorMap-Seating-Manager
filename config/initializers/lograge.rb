Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new
  config.lograge.logger = ActiveSupport::Logger.new("log/lograge_#{Rails.env}.log")
end
