require 'net/http'
require 'json'
require 'uri'

class OpenMeteoWeatherService
  include ActiveSupport::Configurable

  # Base URL for the Open-Meteo API
  BASE_URL = 'https://historical-forecast-api.open-meteo.com/v1/forecast'

  # Default parameters
  DEFAULT_PARAMS = {
    wind_speed_unit: 'mph',
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch'
  }

  def initialize
    @cache = Rails.cache
  end

  # Get historical weather data for a specific location and date range
  def get_historical_weather(latitude:, longitude:, start_date:, end_date:, hourly_variables: ['temperature_2m'])
    cache_key = "open_meteo_weather_#{latitude}_#{longitude}_#{start_date}_#{end_date}_#{hourly_variables.join('_')}"
    
    # Try to get from cache first
    cached_data = @cache.read(cache_key)
    # this .? returns the cached data if it exists else it returns nothing
    return cached_data if cached_data.present?

    # Build parameters
    params = DEFAULT_PARAMS.merge({
      latitude: latitude,
      longitude: longitude,
      start_date: start_date,
      end_date: end_date,
      hourly: hourly_variables.join(',')
    })

    # Make API request with retry logic
    response = make_request_with_retry(params)
    
    return nil unless response

    # Process the response
    processed_data = process_response(response)
    
    # Cache the result for 1 hour (3600 seconds)
    @cache.write(cache_key, processed_data, expires_in: 1.hour)
    
    processed_data
  rescue => e
    Rails.logger.error "Open-Meteo API Error: #{e.message}"
    nil
  end

  # Get current weather for a location
  def get_current_weather(latitude:, longitude:)
    today = Date.current.strftime('%Y-%m-%d')
    get_historical_weather(
      latitude: latitude,
      longitude: longitude,
      start_date: today,
      end_date: today,
      hourly_variables: ['temperature_2m', 'relative_humidity_2m', 'precipitation', 'weather_code']
    )
  end

  # Get weather forecast for a location
  def get_forecast(latitude:, longitude:, days: 7)
    start_date = Date.current.strftime('%Y-%m-%d')
    end_date = (Date.current + days.days).strftime('%Y-%m-%d')
    
    get_historical_weather(
      latitude: latitude,
      longitude: longitude,
      start_date: start_date,
      end_date: end_date,
      hourly_variables: ['temperature_2m', 'relative_humidity_2m', 'precipitation', 'weather_code']
    )
  end

  # these private functions are used to make the API request and process the response but are not exposed to the controller basically
  private

  def make_request_with_retry(params, max_retries: 3)
    retries = 0
    
    # essentially were looping through the max_retries and making the API request and if it fails we retry
    while retries < max_retries
      begin
        response = make_api_request(params)
        return response if response
      rescue => e
        retries += 1
        Rails.logger.warn "Open-Meteo API retry #{retries}/#{max_retries}: #{e.message}"
        
        if retries < max_retries
          # Exponential backoff: 0.2, 0.4, 0.8, 1.6, 3.2 seconds
          sleep_time = 0.2 * (2 ** (retries - 1))
          sleep(sleep_time)
        end
      end
    end
    
    Rails.logger.error "Open-Meteo API failed after #{max_retries} retries"
    nil
  end

  def make_api_request(params)
    uri = URI(BASE_URL)
    uri.query = URI.encode_www_form(params)
    
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 30
    http.open_timeout = 10
    
    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = 'Rails-Weather-App/1.0'
    
    response = http.request(request)
    
    case response
    when Net::HTTPSuccess
      JSON.parse(response.body)
    else
      Rails.logger.error "Open-Meteo API HTTP Error: #{response.code} - #{response.body}"
      nil
    end
  rescue => e
    Rails.logger.error "Open-Meteo API Request Error: #{e.message}"
    nil
  end

  def process_response(response_data)
    return nil unless response_data && response_data['hourly']

    # Extract location info
    location_info = {
      latitude: response_data['latitude'],
      longitude: response_data['longitude'],
      elevation: response_data['elevation'],
      timezone: response_data['timezone'],
      timezone_abbreviation: response_data['timezone_abbreviation'],
      utc_offset_seconds: response_data['utc_offset_seconds']
    }

    # Process hourly data
    hourly_data = process_hourly_data(response_data['hourly'])

    {
      location: location_info,
      hourly_data: hourly_data,
      generated_at: Time.current
    }
  end

  def process_hourly_data(hourly_response)
    return [] unless hourly_response && hourly_response['time']

    times = hourly_response['time']
    data = {}

    # Extract all available variables
    hourly_response.each do |key, values|
      next if key == 'time'
      data[key] = values
    end

    # Create array of hourly records
    times.map.with_index do |time, index|
      record = { 'time' => time }
      
      data.each do |variable, values|
        record[variable] = values[index] if values[index]
      end
      
      record
    end
  end
end 