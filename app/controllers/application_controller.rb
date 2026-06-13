class ApplicationController < ActionController::Base
  include InertiaRails::Controller

  allow_browser versions: :modern
end
