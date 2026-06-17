Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new

  if Rails.env.production?
    config.lograge.logger = ActiveSupport::Logger.new(STDOUT)
  else
    log_path = "log/lograge_#{Rails.env}.log"
    FileUtils.mkdir_p(File.dirname(log_path))
    config.lograge.logger = ActiveSupport::Logger.new(log_path)
  end
end
