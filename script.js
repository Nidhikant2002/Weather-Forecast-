const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your API key
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

async function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                alert('Error getting location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

async function searchLocation() {
    const location = document.getElementById('location-input').value;
    if (!location) return;

    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Geocoding Error: ${errorData.message}`);
        }
        
        const data = await response.json();
        
        if (data.length > 0) {
            getWeatherByCoords(data[0].lat, data[0].lon);
        } else {
            alert('Location not found');
        }
    } catch (error) {
        console.error('Search Error:', error);
        alert('Error searching location: ' + error.message);
    }
}

async function getWeatherByCoords(lat, lon) {
    try {
        // Get current weather - using HTTPS
        const currentResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        // Check if the response is ok
        if (!currentResponse.ok) {
            const errorData = await currentResponse.json();
            throw new Error(`Weather API Error: ${errorData.message}`);
        }
        
        const currentData = await currentResponse.json();
        displayCurrentWeather(currentData);

        // Get forecast using 5-day forecast API (free tier compatible)
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        // Check if the response is ok
        if (!forecastResponse.ok) {
            const errorData = await forecastResponse.json();
            throw new Error(`Forecast API Error: ${errorData.message}`);
        }
        
        const forecastData = await forecastResponse.json();
        
        // Process 5-day forecast data to daily format
        const dailyForecast = processForecastData(forecastData.list);
        displayForecast(dailyForecast);
    } catch (error) {
        console.error('API Error Details:', error);
        alert('Error fetching weather data: ' + error.message);
    }
}

// New function to process 5-day/3-hour forecast into daily forecast
function processForecastData(forecastList) {
    const dailyData = {};
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        
        if (!dailyData[date]) {
            dailyData[date] = {
                dt: item.dt,
                temp: {
                    min: item.main.temp,
                    max: item.main.temp
                },
                weather: item.weather,
            };
        } else {
            dailyData[date].temp.min = Math.min(dailyData[date].temp.min, item.main.temp);
            dailyData[date].temp.max = Math.max(dailyData[date].temp.max, item.main.temp);
        }
    });

    return Object.values(dailyData).slice(0, 7);
}

function displayCurrentWeather(data) {
    if (!data || !data.weather || !data.weather[0] || !data.main) {
        console.error('Invalid data structure:', data);
        return;
    }

    const currentDetails = document.getElementById('current-details');
    currentDetails.innerHTML = `
        <h3>${data.name || 'Unknown Location'}</h3>
        <img class="weather-icon" src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon">
        <p>🌡️ Temperature: <span class="temp-high">${Math.round(data.main.temp)}°C</span></p>
        <p>🌡️ Feels like: ${Math.round(data.main.feels_like)}°C</p>
        <p>💧 Humidity: ${data.main.humidity}%</p>
        <p>💨 Wind: ${data.wind?.speed || 0} m/s</p>
        <p>☁️ Description: ${data.weather[0].description}</p>
    `;
}

function displayForecast(forecastData) {
    if (!Array.isArray(forecastData)) {
        console.error('Invalid forecast data:', forecastData);
        return;
    }

    const forecastCards = document.getElementById('forecast-cards');
    forecastCards.innerHTML = '';

    forecastData.slice(0, 7).forEach(day => {
        if (!day || !day.weather || !day.weather[0] || !day.temp) {
            console.error('Invalid day data:', day);
            return;
        }

        const date = new Date(day.dt * 1000);
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <h4>${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
            <img class="weather-icon" src="http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="Weather icon">
            <p>High: <span class="temp-high">${Math.round(day.temp.max)}°C</span></p>
            <p>Low: <span class="temp-low">${Math.round(day.temp.min)}°C</span></p>
            <p>${day.weather[0].description}</p>
        `;
        forecastCards.appendChild(card);
    });
}

// Initialize app with user's current location
getCurrentLocation(); 