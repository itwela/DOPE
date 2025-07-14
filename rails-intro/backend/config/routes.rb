Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  # api routes
  # /api/v1/weather/:city/forecast/current
  # /api/v1/weather/:city/forecast/daily
  # /api/v1/weather/:city/forecast/hourly

  namespace :api do
    namespace :v1 do
      # Weather data management (CRUD operations)
      resources :weather
      
      # Company data management (CRUD operations)
      resources :companies
      
      # Weather forecast from Open-Meteo API
      resources :weather_forecast, only: [:index] do
        collection do
          get :current
          get :forecast
          get :historical
        end
      end
    end 
  end 
end
