'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  WeatherContextType, 
  WeatherRecord, 
  WeatherFormData, 
  OpenMeteoResponse, 
  ApiResponse 
} from '../types/weather';
import { useToastMessage } from './ToastMessageContext';

const WeatherContext = createContext<WeatherContextType | null>(null);

interface WeatherProviderProps {
  children: ReactNode;
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  // Weather data management (CRUD operations)
  const [weatherData, setWeatherData] = useState<WeatherRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { setToastMessage } = useToastMessage();

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
      const response = await fetch('http://localhost:3001/api/v1/weather');
      const data: WeatherRecord[] = await response.json();
      setWeatherData(data);
      setToastMessage('✅ Weather data loaded successfully!');
    } catch (error) {
      setToastMessage('❌ Error loading weather data: ' + (error as Error).message);
    }
    setLoading(false);
  };

  // Get current weather from Open-Meteo API - Third party API
  const getCurrentWeather = async (latitude: number = 52.52, longitude: number = 13.41): Promise<void> => {
    setForecastLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/v1/weather_forecast/current?latitude=${latitude}&longitude=${longitude}`);
      const data: ApiResponse<OpenMeteoResponse> = await response.json();
      setForecastData(data);
      setToastMessage('✅ Open-Meteo weather data loaded successfully!');
    } catch (error) {
      setToastMessage('❌ Error loading Open-Meteo weather: ' + (error as Error).message);
    }
    setForecastLoading(false);
  };

  // READ-ONLY: Create weather function removed - database is read-only
  const createWeather = async (): Promise<void> => {
    setToastMessage('❌ Cannot create weather - database is read-only');
  };

  // READ-ONLY: Delete weather function removed - database is read-only
  const deleteWeather = async (id: number): Promise<void> => {
    setToastMessage(id + '❌ Cannot delete weather - database is read-only');
  };

  // READ-ONLY: Update weather function removed - database is read-only
  const updateWeather = async (id: number, updatedData: Partial<WeatherRecord>): Promise<void> => {
    setToastMessage(id + ' ' + updatedData.city + '❌ Cannot update weather - database is read-only');
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
    setToastMessage('');
  };

  // Clear forecast data
  const clearForecastData = (): void => {
    setForecastData(null);
  };

  // Load data on component mount
  useEffect(() => {
    // loadWeatherData();
  }, []);

  return (
    <WeatherContext.Provider value={{
      // State
      weatherData,
      setWeatherData,
      loading,
      setLoading,
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