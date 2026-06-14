Sidekiq.configure_server do |config|
  config.redis = {
    url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
  }
  config.concurrency = ENV.fetch('SIDEKIQ_CONCURRENCY', 5).to_i
  config.max_retries = 25
  config.timeout = 30
end

Sidekiq.configure_client do |config|
  config.redis = {
    url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
  }
end
