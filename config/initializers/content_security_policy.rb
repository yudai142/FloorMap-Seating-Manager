Rails.application.config.content_security_policy do |policy|
  policy.default_src :self
  policy.font_src    :self, :https, :data
  policy.img_src     :self, :https, :data
  policy.object_src  :none
  policy.script_src  :self, :https, :unsafe_inline
  policy.style_src   :self, :https, :unsafe_inline
  policy.connect_src :self, :wss
  policy.media_src   :self, :https
  policy.frame_src   :self
  policy.child_src   :self

  # Vite development server (localhost:3036)
  if Rails.env.development?
    policy.script_src  :self, :https, :unsafe_inline, :http, 'http://localhost:3036'
    policy.style_src   :self, :https, :unsafe_inline, 'http://localhost:3036'
    policy.connect_src :self, :wss, :ws, 'http://localhost:3036', 'ws://localhost:3036'
  end
end
