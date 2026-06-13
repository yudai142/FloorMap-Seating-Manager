class Rack::Attack
  # レート制限の設定
  Rack::Attack.throttle('check_in/ip', limit: 30, period: 60) do |req|
    req.ip if req.path.include?('/check_in') || req.path.include?('/check_out')
  end

  Rack::Attack.throttle('logins/ip', limit: 10, period: 60) do |req|
    req.ip if req.path == '/users/sign_in' && req.post?
  end

  # ブロック時の応答
  Rack::Attack.throttled_responder = lambda { |env|
    status = 429
    headers = { 'Content-Type' => 'application/json' }
    body = { error: 'Too many requests. Please try again later.' }.to_json
    [status, headers, [body]]
  }
end
