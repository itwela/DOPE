// Weather data interfaces
export interface WeatherRecord {
  id: number;
  city: string;
  temperature: number;
  condition: string;
  created_at: string;
  updated_at: string;
}

export interface WeatherFormData {
  city: string;
  temperature: string;
  condition: string;
}

// Open-Meteo API interfaces
export interface LocationInfo {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
}

export interface HourlyDataRecord {
  time: string;
  temperature_2m?: number;
  relative_humidity_2m?: number;
  precipitation?: number;
  weather_code?: number;
  [key: string]: unknown; // For other weather variables
}

export interface OpenMeteoResponse {
  location: LocationInfo;
  hourly_data: HourlyDataRecord[];
  generated_at: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  error?: string;
}

// Context interfaces
export interface WeatherContextType {
  // State
  weatherData: WeatherRecord[];
  setWeatherData: React.Dispatch<React.SetStateAction<WeatherRecord[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  forecastData: ApiResponse<OpenMeteoResponse> | null;
  setForecastData: React.Dispatch<React.SetStateAction<ApiResponse<OpenMeteoResponse> | null>>;
  forecastLoading: boolean;
  setForecastLoading: React.Dispatch<React.SetStateAction<boolean>>;
  formData: WeatherFormData;
  setFormData: React.Dispatch<React.SetStateAction<WeatherFormData>>;

  // Actions
  loadWeatherData: () => Promise<void>;
  getCurrentWeather: (latitude?: number, longitude?: number) => Promise<void>;
  createWeather: () => Promise<void>; // READ-ONLY: Disabled
  deleteWeather: (id: number) => Promise<void>; // READ-ONLY: Disabled
  updateWeather: (id: number, updatedData: Partial<WeatherRecord>) => Promise<void>; // READ-ONLY: Disabled
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearMessage: () => void;
  clearForecastData: () => void;
} 