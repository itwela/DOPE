module Api
  module V1
    class WeatherController < ApplicationController
      before_action :set_weather, only: %i[show update destroy] 

      # GET /api/v1/weather
      def index
        # Show all weather data
        @weather = Weather.all
        render json: @weather
      end

      # POST /api/v1/weather
      def create
        # Create new weather data
        @weather = Weather.new(weather_params)
        # save the weather data to the database
        if @weather.save
          render json: {message: "Weather data created successfully", data: @weather}, status: :created
        else
          render json: {message: "Weather data creation failed", data: @weather.errors}, status: :unprocessable_entity
        end
      end

      # GET /api/v1/weather/:id
      def show
        # Show single and specific weather data
        if @weather
          render json: {message: "Weather data fetched successfully", data: @weather}, status: :ok
        else
          render json: {message: "Weather data not found", data: @weather.errors}, status: :not_found
        end
      end

      # PUT /api/v1/weather/:id
      def update
        # Update single and specific weather data
        if @weather.update(weather_params)
          render json: {message: "Weather data updated successfully", data: @weather}, status: :ok
        else
          render json: {message: "Weather data update failed", data: @weather.errors}, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/weather/:id
      def destroy
        # Delete single and specific weather data
        if @weather.destroy
          render json: {message: "Weather data deleted successfully", data: @weather}, status: :ok
        else
          render json: {message: "Weather data deletion failed", data: @weather.errors}, status: :unprocessable_entity
        end
      end

      private

      def set_weather
        @weather = Weather.find(params[:id])
      end

      def weather_params
        params.require(:weather).permit(:city, :temperature, :condition)
      end
      
    end
  end
end