Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # PWA Service Worker
  get "service-worker.js", to: "pwa#service_worker", as: :service_worker

  devise_for :users

  resources :rooms, only: %i[index show create update], param: :token do
    resources :seats, only: %i[create update destroy] do
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
  
  get "two_factor/setup", to: "two_factor#setup", as: "two_factor_setup"
  post "two_factor/confirm", to: "two_factor#confirm", as: "two_factor_confirm"
  delete "two_factor/disable", to: "two_factor#disable", as: "two_factor_disable"
  
  get "users/settings", to: "users#settings", as: "user_settings"
  
  resources :invitations, only: %i[index create destroy] do
    member do
      get :accept
      post :confirm
    end
  end
  
  get "analytics", to: "analytics#index", as: "analytics"

  namespace :api do
    namespace :v1 do
      resources :rooms, only: %i[index show create update] do
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
  
  # Rswag API documentation (development/test only)
  if Rails.env.development? || Rails.env.test?
    mount Rswag::Ui::Engine => '/api-docs'
    mount Rswag::Api::Engine => '/api-docs'
  end

  mount RailsAdmin::Engine => "/admin", as: "rails_admin"

  require 'sidekiq/web'
  Sidekiq::Web.use Rack::Auth::Basic do |username, password|
    username == ENV.fetch('SIDEKIQ_USERNAME', 'admin') &&
    password == ENV.fetch('SIDEKIQ_PASSWORD', 'changeme')
  end
  mount Sidekiq::Web => '/sidekiq'
end
