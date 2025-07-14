module Api
  module V1
    class WeatherForecastController < ApplicationController
      before_action :validate_coordinates, only: [:current, :forecast, :historical]

      # GET /api/v1/weather_forecast/current
      def current
        weather_service = OpenMeteoWeatherService.new
        weather_data = weather_service.get_current_weather(
          latitude: params[:latitude],
          longitude: params[:longitude]
        )

        if weather_data
          render json: {
            message: "Current weather data retrieved successfully",
            data: weather_data
          }, status: :ok
        else
          render json: {
            message: "Failed to retrieve current weather data",
            error: "Weather service unavailable"
          }, status: :service_unavailable
        end
      end

      # GET /api/v1/weather_forecast/forecast
      def forecast
        days = params[:days]&.to_i || 7
        days = [days, 1].max # Minimum 1 day
        days = [days, 14].min # Maximum 14 days

        weather_service = OpenMeteoWeatherService.new
        weather_data = weather_service.get_forecast(
          latitude: params[:latitude],
          longitude: params[:longitude],
          days: days
        )

        if weather_data
          render json: {
            message: "#{days}-day forecast retrieved successfully",
            data: weather_data
          }, status: :ok
        else
          render json: {
            message: "Failed to retrieve weather forecast",
            error: "Weather service unavailable"
          }, status: :service_unavailable
        end
      end

      # GET /api/v1/weather_forecast/historical
      def historical
        start_date = params[:start_date]
        end_date = params[:end_date]
        hourly_variables = params[:hourly_variables]&.split(',') || ['temperature_2m']

        # Validate dates
        unless valid_date?(start_date) && valid_date?(end_date)
          render json: {
            message: "Invalid date format",
            error: "Dates must be in YYYY-MM-DD format"
          }, status: :bad_request
          return
        end

        weather_service = OpenMeteoWeatherService.new
        weather_data = weather_service.get_historical_weather(
          latitude: params[:latitude],
          longitude: params[:longitude],
          start_date: start_date,
          end_date: end_date,
          hourly_variables: hourly_variables
        )

        if weather_data
          render json: {
            message: "Historical weather data retrieved successfully",
            data: weather_data
          }, status: :ok
        else
          render json: {
            message: "Failed to retrieve historical weather data",
            error: "Weather service unavailable"
          }, status: :service_unavailable
        end
      end

      private

      def validate_coordinates
        latitude = params[:latitude]&.to_f
        longitude = params[:longitude]&.to_f

        unless latitude && longitude && 
               latitude.between?(-90, 90) && 
               longitude.between?(-180, 180)
          render json: {
            message: "Invalid coordinates",
            error: "Latitude must be between -90 and 90, longitude between -180 and 180"
          }, status: :bad_request
        end
      end

      def valid_date?(date_string)
        return false unless date_string.present?
        
        begin
          Date.parse(date_string)
          true
        rescue Date::Error
          false
        end
      end
      
    end
  end
end 