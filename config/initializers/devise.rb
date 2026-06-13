Devise.setup do |config|
  config.mailer_sender = 'please-change-me-at-config-initializers-devise@example.com'

  require 'devise/orm/active_record'

  config.case_insensitive_keys = [:email]
  config.strip_whitespace_keys = [:email]

  config.skip_session_storage = [:http_auth]

  config.stretches = Rails.env.test? ? 1 : 12
  config.send_password_change_notification = false
  config.password_length = 6..128
  config.email_regexp = /@/

  config.reset_password_within = 6.hours
  config.remember_for = 2.weeks

  config.expire_all_remember_me_on_sign_out = true
  config.extend_remember_period_on_sign_in = false

  # Timeoutable configuration - session expires after 2 hours of inactivity
  config.timeout_in = 2.hours
  config.responder = lambda { |controller, heading, body, status| controller.render text: body, status: status }

  config.sign_out_via = :delete
end
