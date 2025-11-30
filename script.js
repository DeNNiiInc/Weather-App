// ==================== Configuration ====================
// Using Open-Meteo API - No API key required!
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// ==================== State Management ====================
let currentLocation = { lat: null, lon: null, name: '', country: '' };
let weatherData = null;
let selectedDay = 0;

// ==================== DOM Elements ====================
const elements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    currentWeatherContent: document.getElementById('currentWeatherContent'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    forecastCards: document.getElementById('forecastCards'),
    hourlyForecast: document.getElementById('hourlyForecast'),
    daySelectors: document.querySelectorAll('.day-selector')
};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    attachEventListeners();
});

function initializeApp() {
    // Load Melbourne, Australia by default for instant weather display
    searchCity('Melbourne, Australia');

    // Then try to get user's location in the background
    // If they allow it, the weather will update to their location
    setTimeout(() => {
        getUserLocation();
    }, 1000); // Small delay to let Melbourne load first
}

function attachEventListeners() {
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    elements.locationBtn.addEventListener('click', getUserLocation);

    elements.daySelectors.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDay = parseInt(btn.dataset.day);
            updateDaySelector();
            updateHourlyForecast();
        });
    });
}

// ==================== Geolocation ====================
function getUserLocation() {
    if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        return;
    }

    showLoading();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            currentLocation.lat = position.coords.latitude;
            currentLocation.lon = position.coords.longitude;

            // Get location name using reverse geocoding
            try {
                const response = await fetch(
                    `${GEOCODING_API}?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&count=1&format=json`
                );
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    currentLocation.name = data.results[0].name;
                    currentLocation.country = data.results[0].country_code?.toUpperCase() || '';
                }
            } catch (error) {
                console.log('Could not get location name:', error);
                currentLocation.name = 'Current Location';
            }

            await fetchWeatherData(currentLocation.lat, currentLocation.lon);
        },
        (error) => {
            // Silently fail - Melbourne is already loaded as default
            console.log('Geolocation not available or denied:', error.message);
            hideLoading();
        }
    );
}

// ==================== Search Functionality ====================
async function handleSearch() {
    const city = elements.searchInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    await searchCity(city);
}

async function searchCity(cityName) {
    showLoading();

    try {
        // Use Open-Meteo geocoding API
        const response = await fetch(
            `${GEOCODING_API}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
        );

        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error('City not found');
        }

        const location = data.results[0];
        currentLocation.lat = location.latitude;
        currentLocation.lon = location.longitude;
        currentLocation.name = location.name;
        currentLocation.country = location.country_code?.toUpperCase() || '';

        await fetchWeatherData(currentLocation.lat, currentLocation.lon);
    } catch (error) {
        hideLoading();
        showError(`Could not find city "${cityName}". Please try again.`);
    }
}

// ==================== API Calls ====================
async function fetchWeatherData(lat, lon) {
    try {
        // Open-Meteo API - fetch all weather data in one call
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,surface_pressure,visibility',
            hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,apparent_temperature',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
            timezone: 'auto',
            forecast_days: 7
        });

        const response = await fetch(`${WEATHER_API}?${params}`);

        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }

        weatherData = await response.json();

        // Update UI
        updateCurrentWeather();
        updateForecast();
        updateHourlyForecast();
        hideLoading();
        hideError();

    } catch (error) {
        hideLoading();
        showError('Failed to fetch weather data. Please try again.');
        console.error('Weather fetch error:', error);
    }
}

// ==================== UI Updates ====================
function updateCurrentWeather() {
    if (!weatherData || !weatherData.current) return;

    const current = weatherData.current;
    const daily = weatherData.daily;

    // Update location and date
    const locationText = currentLocation.country
        ? `${currentLocation.name}, ${currentLocation.country}`
        : currentLocation.name || 'Current Location';
    document.getElementById('cityName').textContent = locationText;
    document.getElementById('currentDate').textContent = formatDate(new Date());

    // Update temperature
    document.getElementById('currentTemp').textContent = Math.round(current.temperature_2m);
    document.getElementById('feelsLike').textContent = Math.round(current.apparent_temperature);

    // Update weather description
    const weatherInfo = getWeatherInfo(current.weather_code);
    document.getElementById('weatherDesc').textContent = weatherInfo.description;

    // Update weather icon
    const isDay = isCurrentlyDay(daily.sunrise[0], daily.sunset[0]);
    document.getElementById('mainWeatherIcon').src = weatherInfo.icon(isDay);
    document.getElementById('mainWeatherIcon').alt = weatherInfo.description;

    // Update details
    document.getElementById('humidity').textContent = `${Math.round(current.relative_humidity_2m)}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('pressure').textContent = `${Math.round(current.pressure_msl || current.surface_pressure)} hPa`;
    document.getElementById('visibility').textContent = `${(current.visibility / 1000).toFixed(1)} km`;

    // UV Index (not available in Open-Meteo free tier)
    document.getElementById('uvIndex').textContent = 'N/A';

    // Precipitation
    const precip = current.precipitation || 0;
    document.getElementById('precipitation').textContent = precip > 0 ? `${precip.toFixed(1)} mm` : '0 mm';

    // Sunrise and sunset
    document.getElementById('sunrise').textContent = formatTime(new Date(daily.sunrise[0]));
    document.getElementById('sunset').textContent = formatTime(new Date(daily.sunset[0]));

    // Update background based on weather
    updateBackground(weatherInfo.main, isDay);
}

function updateForecast() {
    if (!weatherData || !weatherData.daily) return;

    const daily = weatherData.daily;

    // Clear existing cards
    elements.forecastCards.innerHTML = '';

    // Create forecast cards for 7 days
    for (let i = 0; i < 7; i++) {
        const card = createForecastCard(daily, i);
        elements.forecastCards.appendChild(card);
    }

    updateDayButtons();
}

function createForecastCard(daily, index) {
    const card = document.createElement('div');
    card.className = 'forecast-card';

    const date = new Date(daily.time[index]);
    const dayName = index === 0 ? 'Today' : formatDayName(date);

    const tempHigh = Math.round(daily.temperature_2m_max[index]);
    const tempLow = Math.round(daily.temperature_2m_min[index]);

    const weatherInfo = getWeatherInfo(daily.weather_code[index]);
    const precipProb = Math.round(daily.precipitation_probability_max[index] || 0);
    const windSpeed = Math.round(daily.wind_speed_10m_max[index]);

    card.innerHTML = `
        <div class="forecast-day">${dayName}</div>
        <div class="forecast-date">${formatShortDate(date)}</div>
        <div class="forecast-icon">
            <img src="${weatherInfo.icon(true)}" alt="${weatherInfo.description}">
        </div>
        <div class="forecast-temp">
            <span class="temp-high">${tempHigh}°</span>
            <span class="temp-low">${tempLow}°</span>
        </div>
        <div class="forecast-desc">${weatherInfo.description}</div>
        <div class="forecast-details">
            <div class="forecast-detail">
                <span class="forecast-detail-label">Rain</span>
                <span>${precipProb}%</span>
            </div>
            <div class="forecast-detail">
                <span class="forecast-detail-label">Wind</span>
                <span>${windSpeed} km/h</span>
            </div>
        </div>
    `;

    return card;
}

function updateHourlyForecast() {
    if (!weatherData || !weatherData.hourly) return;

    const hourly = weatherData.hourly;

    // Clear existing hourly items
    elements.hourlyForecast.innerHTML = '';

    // Calculate start and end indices for the selected day
    const hoursPerDay = 24;
    const startIndex = selectedDay * hoursPerDay;
    const endIndex = Math.min(startIndex + hoursPerDay, hourly.time.length);

    // Create hourly items for the selected day
    for (let i = startIndex; i < endIndex; i++) {
        const item = createHourlyItem(hourly, i);
        elements.hourlyForecast.appendChild(item);
    }
}

function createHourlyItem(hourly, index) {
    const item = document.createElement('div');
    item.className = 'hourly-item';

    const time = new Date(hourly.time[index]);
    const temp = Math.round(hourly.temperature_2m[index]);
    const weatherInfo = getWeatherInfo(hourly.weather_code[index]);
    const precipProb = Math.round(hourly.precipitation_probability[index] || 0);
    const windSpeed = Math.round(hourly.wind_speed_10m[index]);
    const humidity = Math.round(hourly.relative_humidity_2m[index]);

    item.innerHTML = `
        <div class="hourly-time">${formatTime(time)}</div>
        <div class="hourly-icon">
            <img src="${weatherInfo.icon(true)}" alt="${weatherInfo.description}">
        </div>
        <div class="hourly-temp">${temp}°C</div>
        <div class="hourly-desc">${weatherInfo.description}</div>
        <div class="hourly-details">
            <div>💧 ${precipProb}%</div>
            <div>💨 ${windSpeed} km/h</div>
            <div>💦 ${humidity}%</div>
        </div>
    `;

    return item;
}

function updateDaySelector() {
    elements.daySelectors.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.day) === selectedDay);
    });
}

function updateDayButtons() {
    if (!weatherData || !weatherData.daily) return;

    const daily = weatherData.daily;

    elements.daySelectors.forEach((btn, index) => {
        if (index === 0) {
            btn.textContent = 'Today';
        } else if (index === 1) {
            btn.textContent = 'Tomorrow';
        } else {
            const date = new Date(daily.time[index]);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            btn.textContent = dayName;
        }
    });
}

// ==================== Weather Code Mapping ====================
// WMO Weather interpretation codes (WW)
function getWeatherInfo(code) {
    const weatherCodes = {
        0: { main: 'Clear', description: 'Clear sky', icon: (isDay) => `https://openweathermap.org/img/wn/${isDay ? '01d' : '01n'}@4x.png` },
        1: { main: 'Clear', description: 'Mainly clear', icon: (isDay) => `https://openweathermap.org/img/wn/${isDay ? '01d' : '01n'}@4x.png` },
        2: { main: 'Clouds', description: 'Partly cloudy', icon: (isDay) => `https://openweathermap.org/img/wn/${isDay ? '02d' : '02n'}@4x.png` },
        3: { main: 'Clouds', description: 'Overcast', icon: (isDay) => `https://openweathermap.org/img/wn/03d@4x.png` },
        45: { main: 'Fog', description: 'Foggy', icon: (isDay) => `https://openweathermap.org/img/wn/50d@4x.png` },
        48: { main: 'Fog', description: 'Depositing rime fog', icon: (isDay) => `https://openweathermap.org/img/wn/50d@4x.png` },
        51: { main: 'Drizzle', description: 'Light drizzle', icon: (isDay) => `https://openweathermap.org/img/wn/09d@4x.png` },
        53: { main: 'Drizzle', description: 'Moderate drizzle', icon: (isDay) => `https://openweathermap.org/img/wn/09d@4x.png` },
        55: { main: 'Drizzle', description: 'Dense drizzle', icon: (isDay) => `https://openweathermap.org/img/wn/09d@4x.png` },
        56: { main: 'Drizzle', description: 'Light freezing drizzle', icon: (isDay) => `https://openweathermap.org/img/wn/09d@4x.png` },
        57: { main: 'Drizzle', description: 'Dense freezing drizzle', icon: (isDay) => `https://openweathermap.org/img/wn/09d@4x.png` },
        61: { main: 'Rain', description: 'Slight rain', icon: (isDay) => `https://openweathermap.org/img/wn/10d@4x.png` },
        63: { main: 'Rain', description: 'Moderate rain', icon: (isDay) => `https://openweathermap.org/img/wn/10d@4x.png` },
        65: { main: 'Rain', description: 'Heavy rain', icon: (isDay) => `https://openweathermap.org/img/wn/10d@4x.png` },
        66: { main: 'Rain', description: 'Light freezing rain', icon: (isDay) => `https://openweathermap.org/img/wn/13d@4x.png` },
        67: { main: 'Rain', description: 'Heavy freezing rain', icon: (isDay) => `https://openweathermap.org/img/wn/13d@4x.png` },
        71: { main: 'Snow', description: 'Slight snow', icon: (isDay) => `https://openweathermap.org/img/wn/13d@4x.png` },
        73: { main: 'Snow', description: 'Moderate snow', icon: (isDay) => `https://openweathermap.org/img/wn/13d@4x.png` },
        75: { main: 'Snow', description: 'Heavy snow', icon: (isDay) => `https://openweathermap.org/img/wn/13d@4x.png` },
        77: { main: 'Snow', description: 'Snow grains', icon: (isDay) => `https://openweathermap.org/img/wn/13d@4x.png` },
        80: { main: 'Rain', description: 'Slight rain showers', icon: (isDay) => `https://openweathermap.org/img/wn/09d@4x.png` },
        81: { main: 'Rain', description: 'Moderate rain showers', icon: (isDay) => `https://openweathermap.org/img/wn/09d@4x.png` },
        82: { main: 'Rain', description: 'Violent rain showers', icon: (isDay) => `https://openweathermap.org/img/wn/09d@4x.png` },
        85: { main: 'Snow', description: 'Slight snow showers', icon: (isDay) => `https://openweathermap.org/img/wn/13d@4x.png` },
        86: { main: 'Snow', description: 'Heavy snow showers', icon: (isDay) => `https://openweathermap.org/img/wn/13d@4x.png` },
        95: { main: 'Thunderstorm', description: 'Thunderstorm', icon: (isDay) => `https://openweathermap.org/img/wn/11d@4x.png` },
        96: { main: 'Thunderstorm', description: 'Thunderstorm with slight hail', icon: (isDay) => `https://openweathermap.org/img/wn/11d@4x.png` },
        99: { main: 'Thunderstorm', description: 'Thunderstorm with heavy hail', icon: (isDay) => `https://openweathermap.org/img/wn/11d@4x.png` }
    };

    return weatherCodes[code] || weatherCodes[0];
}

function isCurrentlyDay(sunrise, sunset) {
    const now = new Date();
    const sunriseTime = new Date(sunrise);
    const sunsetTime = new Date(sunset);
    return now >= sunriseTime && now <= sunsetTime;
}

// ==================== Helper Functions ====================
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatShortDate(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDayName(date) {
    const options = { weekday: 'short' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('en-US', options);
}

function updateBackground(weatherMain, isDay) {
    const body = document.body;

    // Define gradients for different weather conditions
    const gradients = {
        Clear: isDay
            ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)'
            : 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        Clouds: isDay
            ? 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)'
            : 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        Rain: 'linear-gradient(135deg, #283048 0%, #859398 100%)',
        Drizzle: 'linear-gradient(135deg, #3a6186 0%, #89253e 100%)',
        Thunderstorm: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
        Snow: 'linear-gradient(135deg, #e6dada 0%, #274046 100%)',
        Mist: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
        Fog: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
        Haze: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)'
    };

    body.style.background = gradients[weatherMain] || gradients.Clear;
    body.style.transition = 'background 1s ease';
}

// ==================== Loading & Error States ====================
function showLoading() {
    elements.loadingSpinner.style.display = 'block';
    elements.currentWeatherContent.style.display = 'none';
}

function hideLoading() {
    elements.loadingSpinner.style.display = 'none';
    elements.currentWeatherContent.style.display = 'block';
}

function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

// ==================== Ready to Use! ====================
// This weather app uses Open-Meteo API which requires NO API KEY!
// Default location: Melbourne, Australia
// The app will attempt to get your current location after loading Melbourne
//
// Features:
// - Free, no registration required
// - 10,000 requests per day
// - 7-day forecast with hourly data
// - Current weather conditions
// - Geolocation support
