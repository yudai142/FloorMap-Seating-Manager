class PwaController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token

  def service_worker
    response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    send_file Rails.root.join('app/views/pwa/service-worker.js')
  end
end
