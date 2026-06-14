Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Authentication
  devise_for :users

  # Defines the root path route ("/")
  # root "posts#index"
  resources :rooms, only: %i[index show create] do
    resources :seats, only: %i[create update] do
      collection { get :export_csv }
    end
    collection { get :export_csv }
  end

  root to: 'rooms#index'
  get 'editor', to: 'editors#show'

  resources :backups, only: %i[index create] do
    member do
      post :restore
      get  :download
    end
  end

  resources :seats, only: [] do
    member do
      post :check_in
      post :check_out
    end
  end

  resources :notifications, only: %i[index destroy] do
    collection do
      get :unread_count
      patch :mark_all_as_read
    end
    member do
      patch :mark_as_read
    end
  end

  resources :notification_preferences, only: %i[index update]
  get "users/settings", to: "users#settings", as: "user_settings"
  get "two_factor/setup", to: "two_factor#setup", as: "two_factor_setup"
  post "two_factor/confirm", to: "two_factor#confirm", as: "two_factor_confirm"
  delete "two_factor/disable", to: "two_factor#disable", as: "two_factor_disable"

  namespace :api do
    namespace :v1 do
      resources :rooms, only: %i[index show create] do
        resources :seats, only: %i[create update] do
          collection { get :export_csv }
        end
        collection { get :export_csv }
      end
      resources :seats, only: [] do
        member { post :check_in; post :check_out }
      end
    end
  end
  mount RailsAdmin::Engine => "/admin", as: "rails_admin"
end

# Sidekiq Web UI (admin-only)
require 'sidekiq/web'
Sidekiq::Web.use Rack::Auth::Basic do |username, password|
  username == ENV.fetch('SIDEKIQ_USERNAME', 'admin') &&
  password == ENV.fetch('SIDEKIQ_PASSWORD', 'changeme')
end
mount Sidekiq::Web => '/sidekiq'
