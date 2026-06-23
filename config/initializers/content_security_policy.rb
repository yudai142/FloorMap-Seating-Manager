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
end
