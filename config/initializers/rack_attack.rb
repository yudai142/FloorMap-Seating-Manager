class Rack::Attack
  # チェックイン・チェックアウト: 30 req/min
  Rack::Attack.throttle('check_in/ip', limit: 30, period: 60) do |req|
    req.ip if req.path.include?('/check_in') || req.path.include?('/check_out')
  end

  # ログイン: 10 req/min
  Rack::Attack.throttle('logins/ip', limit: 10, period: 60) do |req|
    req.ip if req.path == '/users/sign_in' && req.post?
  end

  # ログイン失敗時のブロック（5回失敗で5分ブロック）
  Rack::Attack.throttle('logins/failed_ip', limit: 5, period: 300) do |req|
    req.ip if req.path == '/users/sign_in' && req.post? && req.params['user'].present?
  end

  # API v1: 60 req/min per IP
  Rack::Attack.throttle('api/v1/ip', limit: 60, period: 60) do |req|
    req.ip if req.path.start_with?('/api/v1')
  end

  # 管理画面 /admin: 30 req/min per IP
  Rack::Attack.throttle('admin/ip', limit: 30, period: 60) do |req|
    req.ip if req.path.start_with?('/admin')
  end

  # Sidekiq Web UI: 50 req/min per IP
  Rack::Attack.throttle('sidekiq/ip', limit: 50, period: 60) do |req|
    req.ip if req.path.start_with?('/sidekiq')
  end

  # ブロック時の応答
  Rack::Attack.throttled_responder = lambda { |env|
    status = 429
    headers = { 'Content-Type' => 'application/json' }
    body = { error: 'Too many requests. Please try again later.' }.to_json
    [status, headers, [body]]
  }
end
