import React from 'react';
import { WeatherProvider, useWeather } from './contexts/WeatherContext';
import './App.css';

const WeatherApp: React.FC = () => {
  const {
    weatherData,
    loading,
    message,
    forecastData,
    forecastLoading,
    formData,
    loadWeatherData,
    getCurrentWeather,
    createWeather,
    deleteWeather,
    handleInputChange,
    clearMessage
  } = useWeather();

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌤️ Weather API Tester</h1>
        <p>Test your Rails weather API endpoints</p>
      </header>

      <main className="App-main">
        {/* Status Message */}
        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
            <button onClick={clearMessage} className="btn btn-small" style={{ marginLeft: '10px' }}>
              ✕
            </button>
          </div>
        )}

        {/* Open-Meteo Weather Forecast Section */}
        <div className="form-section">
          <h2>Open-Meteo Weather Forecast</h2>
          <p>Get real weather data from Open-Meteo API (Berlin, Germany)</p>
          <div className="action-buttons">
            <button 
              onClick={() => getCurrentWeather()}
              disabled={forecastLoading}
              className="btn btn-primary"
            >
              {forecastLoading ? 'Loading...' : '🌤️ Get Current Weather'}
            </button>
          </div>
          
          {forecastData && (
            <div className="forecast-display">
              <h3>📍 {forecastData.data?.location?.latitude}°N, {forecastData.data?.location?.longitude}°E</h3>
              <p>Timezone: {forecastData.data?.location?.timezone}</p>
              <p>Elevation: {forecastData.data?.location?.elevation}m</p>
              
              {forecastData.data?.hourly_data?.length > 0 && (
                <div className="forecast-data">
                  <h4>Latest Weather Data:</h4>
                  <div className="forecast-grid">
                    {forecastData.data.hourly_data.slice(0, 3).map((record, index) => (
                      <div key={index} className="forecast-card">
                        <p><strong>Time:</strong> {new Date(record.time).toLocaleString()}</p>
                        <p><strong>Temperature:</strong> {record.temperature_2m}°F</p>
                        {record.relative_humidity_2m && (
                          <p><strong>Humidity:</strong> {record.relative_humidity_2m}%</p>
                        )}
                        {record.precipitation && (
                          <p><strong>Precipitation:</strong> {record.precipitation} inches</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Weather Form */}
        <div className="form-section">
          <h2>Add New Weather Data</h2>
          <div className="form-group">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="temperature"
              placeholder="Temperature"
              value={formData.temperature}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="condition"
              placeholder="Condition (e.g., Sunny, Rainy)"
              value={formData.condition}
              onChange={handleInputChange}
            />
            <button 
              onClick={createWeather}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Weather'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            onClick={loadWeatherData}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? 'Loading...' : '🔄 Refresh Weather Data'}
          </button>
        </div>

        {/* Weather Data Display */}
        <div className="weather-list">
          <h2>Current Weather Data</h2>
          {loading ? (
            <p>Loading...</p>
          ) : weatherData.length === 0 ? (
            <p>No weather data found. Create some data above!</p>
          ) : (
            <div className="weather-grid">
              {weatherData.map((weather) => (
                <div key={weather.id} className="weather-card">
                  <h3>{weather.city}</h3>
                  <p className="temperature">{weather.temperature}°F</p>
                  <p className="condition">{weather.condition}</p>
                  <p className="date">
                    Created: {new Date(weather.created_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => deleteWeather(weather.id)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* JSON Console Log */}
        <div className="json-console">
          <h2>📋 API Response Console</h2>
          <div className="console-header">
            <span>Raw JSON Data from API</span>
          </div>
          <div className="console-content">
            <pre className="json-display">
              {JSON.stringify(weatherData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Open-Meteo JSON Console */}
        {forecastData && (
          <div className="json-console">
            <h2>🌍 Open-Meteo API Response Console</h2>
            <div className="console-header">
              <span>Raw JSON Data from Open-Meteo API</span>
            </div>
            <div className="console-content">
              <pre className="json-display">
                {JSON.stringify(forecastData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <WeatherProvider>
      <WeatherApp />
    </WeatherProvider>
  );
};

export default App; 