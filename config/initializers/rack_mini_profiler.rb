if Rails.env.development?
  Rack::MiniProfiler.config.position = 'bottom-right'
  Rack::MiniProfiler.config.start_hidden = true
  Rack::MiniProfiler.config.max_data_length = 10_000_000
  Rack::MiniProfiler.config.memory_profiler_reference_data_enabled = false
end
