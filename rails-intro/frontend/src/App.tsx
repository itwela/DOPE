import React from 'react';
import { WeatherProvider, useWeather } from './contexts/WeatherContext';
import { LLMProvider } from './contexts/LLMContext';
import { styles, stylesheet } from './styles/AppStyles';
import CollapsibleSection from './components/CollapsibleSection';
import CompanySelector from './components/CompanySelector';
import AiSection from './components/AiSection';
import { ToastMessageProvider } from './contexts/ToastMessageContext';
import { setDefaultOpenAIKey, setOpenAIAPI } from '@openai/agents';
import OpenAI from 'openai';

const LLMApp: React.FC = () => {
  const {
    weatherData,
    loading,
    forecastData,
    forecastLoading,
    formData,
    loadWeatherData,
    getCurrentWeather,
    createWeather,
    deleteWeather,
    handleInputChange,
  } = useWeather();

  return (
    <>
      <style>{stylesheet}</style>
      <div className='w-full h-max flex flex-col items-center justify-center'>
        <div style={styles.app} className="w-full min-h-screen flex flex-col">
          
          {/* NOTE - Header */}
          <header style={styles.appHeader} className="w-full">
            <h1 style={styles.appHeaderH1}>DOPE LLM</h1>
            <p style={styles.appHeaderP}>Testing the DOPE LLM - Tools, Performance, Etc.</p>
          </header>

          {/* NOTE - Main */}
          <main style={styles.appMain} className="w-full space-y-1">
            <CollapsibleSection open={true} title="Marketing LLM">
              <CompanySelector />
              <AiSection />
            </CollapsibleSection>

            <CollapsibleSection title="Open-Meteo Weather Forecast">
              <p style={styles.forecastDisplayP} className="text-sm text-gray-600 pb-2">Get real weather data from Open-Meteo API (Berlin, Germany)</p>
              <div style={styles.actionButtons}>
                <button 
                  onClick={() => getCurrentWeather()}
                  disabled={forecastLoading}
                  style={{ ...styles.btn, ...styles.btnPrimary }}
                  className="w-full sm:w-auto"
                >
                  {forecastLoading ? 'Loading...' : '🌤️ Get Current Weather'}
                </button>
              </div>
              
              {forecastData && (
                <div style={styles.forecastDisplay} className="mt-4">
                  <h3 style={styles.forecastDisplayH3} className="text-base font-medium">📍 {forecastData.data?.location?.latitude}°N, {forecastData.data?.location?.longitude}°E</h3>
                  <p style={styles.forecastDisplayP} className="text-xs">Timezone: {forecastData.data?.location?.timezone}</p>
                  <p style={styles.forecastDisplayP} className="text-xs">Elevation: {forecastData.data?.location?.elevation}m</p>
                  
                  {forecastData.data?.hourly_data?.length > 0 && (
                    <div style={styles.forecastData}>
                      <h4 style={styles.forecastDataH4} className="text-sm font-medium">Latest Weather Data:</h4>
                      <div style={styles.forecastGrid} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {forecastData.data.hourly_data.slice(0, 3).map((record, index) => (
                          <div key={index} style={styles.forecastCard} className="p-3">
                            <p style={styles.forecastCardP}><strong style={styles.forecastCardStrong}>Time:</strong> {new Date(record.time).toLocaleString()}</p>
                            <p style={styles.forecastCardP}><strong style={styles.forecastCardStrong}>Temperature:</strong> {record.temperature_2m}°F</p>
                            {record.relative_humidity_2m && (
                              <p style={styles.forecastCardP}><strong style={styles.forecastCardStrong}>Humidity:</strong> {record.relative_humidity_2m}%</p>
                            )}
                            {record.precipitation && (
                              <p style={styles.forecastCardP}><strong style={styles.forecastCardStrong}>Precipitation:</strong> {record.precipitation} inches</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Add New Weather Data">
              <div style={styles.formGroup} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  style={styles.formGroupInput}
                  className="w-full"
                />
                <input
                  type="number"
                  name="temperature"
                  placeholder="Temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  style={styles.formGroupInput}
                  className="w-full"
                />
                <input
                  type="text"
                  name="condition"
                  placeholder="Condition (e.g., Sunny, Rainy)"
                  value={formData.condition}
                  onChange={handleInputChange}
                  style={styles.formGroupInput}
                  className="w-full"
                />
                <button 
                  onClick={createWeather}
                  disabled={loading}
                  style={{ ...styles.btn, ...styles.btnPrimary }}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Weather'}
                </button>
              </div>
            </CollapsibleSection>

            {/* Action Buttons */}
            <div style={styles.actionButtons} className="w-full">
              <button 
                onClick={loadWeatherData}
                disabled={loading}
                style={{ ...styles.btn, ...styles.btnSecondary }}
                className="w-full sm:w-auto"
              >
                {loading ? 'Loading...' : '🔄 Refresh Weather Data'}
              </button>
            </div>

            <CollapsibleSection title="Current Weather Data">
              {loading ? (
                <p className="text-center text-gray-600">Loading...</p>
              ) : weatherData.length === 0 ? (
                <p className="text-center text-gray-600">No weather data found. Create some data above!</p>
              ) : (
                <div style={styles.weatherGrid} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {weatherData.map((weather) => (
                    <div key={weather.id} style={styles.weatherCard} className="p-3">
                      <h3 style={styles.weatherCardH3} className="text-base font-medium">{weather.city}</h3>
                      <p style={styles.weatherCardTemperature} className="text-xl font-bold">{weather.temperature}°F</p>
                      <p style={styles.weatherCardCondition} className="text-sm">{weather.condition}</p>
                      <p style={styles.weatherCardDate} className="text-xs">
                        Created: {new Date(weather.created_at).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => deleteWeather(weather.id)}
                        style={{ ...styles.btn, ...styles.btnDanger }}
                        disabled={loading}
                        className="w-full mt-2"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection title="API Response Console">
              <div style={styles.consoleContent}>
                <pre style={styles.jsonDisplay}>
                  {JSON.stringify(weatherData, null, 2)}
                </pre>
              </div>
            </CollapsibleSection>

            {forecastData && (
              <CollapsibleSection title="Open-Meteo API Response Console">
                <div style={styles.consoleContent}>
                  <pre style={styles.jsonDisplay}>
                    {JSON.stringify(forecastData, null, 2)}
                  </pre>
                </div>
              </CollapsibleSection>
            )}
            
          </main>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {

  const apiKey = import.meta.env?.VITE_OPENAI_API_KEY || '';

  if (apiKey) {
    setDefaultOpenAIKey(apiKey);
  } else {
    console.log('No API key found');
  }

  const customOpenAIClient = new OpenAI({
    baseURL: 'https://api.openai.com/v1',
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  setOpenAIAPI('responses');

  return (
    <ToastMessageProvider>
      <LLMProvider>
        <WeatherProvider>
          <LLMApp />
        </WeatherProvider>
      </LLMProvider>
    </ToastMessageProvider>
  );
};

export default App; 