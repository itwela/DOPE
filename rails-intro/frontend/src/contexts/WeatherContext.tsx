import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  WeatherContextType, 
  WeatherRecord, 
  WeatherFormData, 
  OpenMeteoResponse, 
  ApiResponse 
} from '../types/weather';

const WeatherContext = createContext<WeatherContextType | null>(null);

interface WeatherProviderProps {
  children: ReactNode;
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  // Weather data management (CRUD operations)
  const [weatherData, setWeatherData] = useState<WeatherRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Open-Meteo weather forecast data
  const [forecastData, setForecastData] = useState<ApiResponse<OpenMeteoResponse> | null>(null);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);

  // Form data for creating weather
  const [formData, setFormData] = useState<WeatherFormData>({
    city: '',
    temperature: '',
    condition: ''
  });

  // Load all weather data - local from Rails API Postgres DB (weather table)
  const loadWeatherData = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/weather');
      const data: WeatherRecord[] = await response.json();
      setWeatherData(data);
      setMessage('✅ Weather data loaded successfully!');
    } catch (error) {
      setMessage('❌ Error loading weather data: ' + (error as Error).message);
    }
    setLoading(false);
  };

  // Get current weather from Open-Meteo API - Third party API
  const getCurrentWeather = async (latitude: number = 52.52, longitude: number = 13.41): Promise<void> => {
    setForecastLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/weather_forecast/current?latitude=${latitude}&longitude=${longitude}`);
      const data: ApiResponse<OpenMeteoResponse> = await response.json();
      setForecastData(data);
      setMessage('✅ Open-Meteo weather data loaded successfully!');
    } catch (error) {
      setMessage('❌ Error loading Open-Meteo weather: ' + (error as Error).message);
    }
    setForecastLoading(false);
  };

  // Create new weather - local from Rails API Postgres DB (weather table)
  const createWeather = async (): Promise<void> => {
    if (!formData.city || !formData.temperature || !formData.condition) {
      setMessage('❌ Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weather: formData }),
      });
      const result: ApiResponse<WeatherRecord> = await response.json();
      setMessage('✅ ' + (result.message || 'Weather created successfully!'));
      setFormData({ city: '', temperature: '', condition: '' });
      loadWeatherData(); // Reload the list
    } catch (error) {
      setMessage('❌ Error creating weather: ' + (error as Error).message);
    }
    setLoading(false);
  };

  // Delete weather - local from Rails API Postgres DB (weather table)
  const deleteWeather = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/weather/${id}`, {
        method: 'DELETE',
      });
      const result: ApiResponse<WeatherRecord> = await response.json();
      setMessage('✅ ' + (result.message || 'Weather deleted successfully!'));
      loadWeatherData(); // Reload the list
    } catch (error) {
      setMessage('❌ Error deleting weather: ' + (error as Error).message);
    }
    setLoading(false);
  };

  // Update weather - local from Rails API Postgres DB (weather table)
  const updateWeather = async (id: number, updatedData: Partial<WeatherRecord>): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/weather/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weather: updatedData }),
      });
      const result: ApiResponse<WeatherRecord> = await response.json();
      setMessage('✅ ' + (result.message || 'Weather updated successfully!'));
      loadWeatherData(); // Reload the list
    } catch (error) {
      setMessage('❌ Error updating weather: ' + (error as Error).message);
    }
    setLoading(false);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Clear message
  const clearMessage = (): void => {
    setMessage('');
  };

  // Clear forecast data
  const clearForecastData = (): void => {
    setForecastData(null);
  };

  // Load data on component mount
  useEffect(() => {
    loadWeatherData();
  }, []);

  return (
    <WeatherContext.Provider value={{
      // State
      weatherData,
      setWeatherData,
      loading,
      setLoading,
      message,
      setMessage,
      forecastData,
      setForecastData,
      forecastLoading,
      setForecastLoading,
      formData,
      setFormData,

      // Actions
      loadWeatherData,
      getCurrentWeather,
      createWeather,
      deleteWeather,
      updateWeather,
      handleInputChange,
      clearMessage,
      clearForecastData,
    }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) throw new Error('useWeather must be used within a WeatherProvider');
  return context;
}; 