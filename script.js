// ==================== Configuration ====================
// Using Open-Meteo API - No API key required!
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_API = "https://air-quality-api.open-meteo.com/v1/air-quality";

// ==================== State Management ====================
let currentLocation = { lat: null, lon: null, name: "", country: "" };
let weatherData = null;
let airQualityData = null;
let selectedDay = 0;

// ==================== DOM Elements ====================
const elements = {
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  locationBtn: document.getElementById("locationBtn"),
  loadingSpinner: document.getElementById("loadingSpinner"),
  currentWeatherContent: document.getElementById("currentWeatherContent"),
  errorMessage: document.getElementById("errorMessage"),
  errorText: document.getElementById("errorText"),
  forecastCards: document.getElementById("forecastCards"),
  hourlyForecast: document.getElementById("hourlyForecast"),
  daySelectors: document.querySelectorAll(".day-selector"),
  extendedGrid: document.getElementById("extendedGrid"),
  // New Elements
  windDirectionArrow: document.getElementById("windDirectionArrow"),
  windDirectionText: document.getElementById("windDirectionText"),
  uvGauge: document.getElementById("uvGauge"),
  aqiGauge: document.getElementById("aqiGauge"),
  sunGraph: document.getElementById("sunGraph"),
};

// ==================== Initialization ====================
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  attachEventListeners();
});

function initializeApp() {
  searchCity("Melbourne, Australia");
  fetchGitInfo(); // Load git commit info
  // Try user location in background
  setTimeout(() => {
    getUserLocation();
  }, 1000);
}

// ==================== Git Info ====================
async function fetchGitInfo() {
  try {
    const response = await fetch('https://api.github.com/repos/DeNNiiInc/Weather-App/commits/main');
    const data = await response.json();
    
    if (data.sha) {
      // Display short commit ID
      const shortSha = data.sha.substring(0, 7);
      document.getElementById('gitCommitId').textContent = shortSha;
      
      // Calculate and display commit age
      const commitDate = new Date(data.commit.committer.date);
      const age = getTimeAgo(commitDate);
      document.getElementById('gitAge').textContent = age;
    }
  } catch (error) {
    document.getElementById('gitCommitId').textContent = 'N/A';
    document.getElementById('gitAge').textContent = 'N/A';
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

function attachEventListeners() {
  elements.searchBtn.addEventListener("click", handleSearch);
  elements.searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  elements.locationBtn.addEventListener("click", getUserLocation);

  // Dynamic day buttons (if we keep them, though 10 days might need a scroll)
  elements.daySelectors.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedDay = parseInt(btn.dataset.day);
      updateDaySelector();
      updateHourlyForecast();
    });
  });
}

// ==================== Geolocation ====================
function getUserLocation() {
  if (!navigator.geolocation) return;

  // Don't show loading for background location fetch to avoid disrupting the default view
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      currentLocation.lat = position.coords.latitude;
      currentLocation.lon = position.coords.longitude;
      await reverseGeocode(currentLocation.lat, currentLocation.lon);
      await fetchAllData(currentLocation.lat, currentLocation.lon);
    },
    (error) => console.log("Geolocation denied or error:", error)
  );
}

async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `${GEOCODING_API}?latitude=${lat}&longitude=${lon}&count=1&format=json`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      currentLocation.name = data.results[0].name;
      currentLocation.country =
        data.results[0].country_code?.toUpperCase() || "";
    }
  } catch (e) {
    currentLocation.name = "Current Location";
  }
}

// ==================== Search Functionality ====================
async function searchCity(cityName) {
  showLoading();
  try {
    const response = await fetch(
      `${GEOCODING_API}?name=${encodeURIComponent(
        cityName
      )}&count=1&language=en&format=json`
    );
    const data = await response.json();

    if (!data.results || data.results.length === 0)
      throw new Error("City not found");

    const location = data.results[0];
    currentLocation.lat = location.latitude;
    currentLocation.lon = location.longitude;
    currentLocation.name = location.name;
    currentLocation.country = location.country_code?.toUpperCase() || "";

    await fetchAllData(currentLocation.lat, currentLocation.lon);
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}

async function handleSearch() {
  const city = elements.searchInput.value.trim();
  if (!city) return;
  await searchCity(city);
}

// ==================== Data Fetching ====================
async function fetchAllData(lat, lon) {
  try {
    // Parallel fetch for Weather and Air Quality
    const [weatherRes, aqiRes] = await Promise.all([
      fetchWeather(lat, lon),
      fetchAirQuality(lat, lon),
    ]);

    weatherData = weatherRes;
    airQualityData = aqiRes;

    updateUI();
    hideLoading();
    hideError();
  } catch (error) {
    hideLoading();
    showError("Failed to fetch data");
    console.error(error);
  }
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,dew_point_2m,visibility",
    hourly:
      "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max",
    timezone: "auto",
    forecast_days: 16, // Get max free tier days (16)
  });

  const response = await fetch(`${WEATHER_API}?${params}`);
  if (!response.ok) throw new Error("Weather API error");
  return response.json();
}

async function fetchAirQuality(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "european_aqi,us_aqi,pm10,pm2_5,ozone,nitrogen_dioxide",
    timezone: "auto",
  });

  const response = await fetch(`${AIR_QUALITY_API}?${params}`);
  if (!response.ok) return null; // Fail gracefully for AQI
  return response.json();
}

// ==================== UI Updates ====================
function updateUI() {
  updateCurrentWeather();

  updateHourlyForecast();
  updateExtendedForecast();
  fetchGitInfo();
}

async function fetchGitInfo() {
  try {
    const response = await fetch('version.json');
    if (!response.ok) throw new Error('Version info not found');
    const data = await response.json();
    
    document.getElementById('gitCommitId').textContent = data.id;
    
    // Calculate age
    const now = Math.floor(Date.now() / 1000);
    const diff = now - data.timestamp;
    
    let ageText = '';
    if (diff < 60) ageText = 'Just now';
    else if (diff < 3600) ageText = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) ageText = `${Math.floor(diff / 3600)}h ago`;
    else ageText = `${Math.floor(diff / 86400)}d ago`;
    
    document.getElementById('gitAge').textContent = ageText;
  } catch (e) {
    console.log('Git info missing');
    document.getElementById('gitCommitId').textContent = 'Dev';
    document.getElementById('gitAge').textContent = 'Local';
  }
}

function updateCurrentWeather() {
  if (!weatherData || !weatherData.current) return;
  const current = weatherData.current;
  const daily = weatherData.daily;

  // Header Info
  document.getElementById("cityName").textContent = currentLocation.country
    ? `${currentLocation.name}, ${currentLocation.country}`
    : currentLocation.name;
  document.getElementById("currentDate").textContent = formatDate(new Date());
  document.getElementById("currentTemp").textContent = Math.round(
    current.temperature_2m
  );
  document.getElementById("feelsLike").textContent = Math.round(
    current.apparent_temperature
  );

  const weatherInfo = getWeatherInfo(current.weather_code);
  document.getElementById("weatherDesc").textContent = weatherInfo.description;

  // Main Icon
  const isDay = current.is_day === 1;
  document.getElementById("mainWeatherIcon").src = weatherInfo.icon(isDay);

  updateBackground(weatherInfo.main, isDay);

  // --- Bento Grid Cards ---

  // 1. Humidity & Dew Point
  document.getElementById("humidity").textContent = `${Math.round(
    current.relative_humidity_2m
  )}%`;
  document.getElementById("dewPoint").textContent = `Dew Point: ${Math.round(
    current.dew_point_2m
  )}°`;

  // 2. Wind
  const windSpeed = Math.round(current.wind_speed_10m);
  const windDir = current.wind_direction_10m;
  const windGusts = Math.round(current.wind_gusts_10m);

  document.getElementById("windSpeed").textContent = windSpeed;
  document.getElementById("windGusts").textContent = windGusts;
  document.getElementById("windDirectionText").textContent =
    getCardinalDirection(windDir);

  // Rotate Arrow
  if (elements.windDirectionArrow) {
    elements.windDirectionArrow.style.transform = `rotate(${windDir}deg)`;
  }

  // 3. Pressure
  const pressure = Math.round(current.pressure_msl || current.surface_pressure);
  document.getElementById("pressure").textContent = pressure;

  // 4. Visibility
  const visKm = (current.visibility / 1000).toFixed(1);
  document.getElementById("visibility").textContent = `${visKm} km`;
  document.getElementById("visibilityText").textContent =
    getVisibilityDescription(visKm);

  // 5. Cloud Cover
  document.getElementById("cloudCover").textContent = `${current.cloud_cover}%`;
  // Visual could be added here if we had a specific icon

  // 6. UV Index (Gauge)
  const uv = current.uv_index;
  document.getElementById("uvIndex").textContent = uv.toFixed(0);
  document.getElementById("uvText").textContent = getUVDescription(uv);
  renderGauge("uvGauge", uv, 11, getUVColor(uv));

  // 7. Air Quality (Gauge)
  if (airQualityData && airQualityData.current) {
    const aqi = airQualityData.current.european_aqi;
    const o3 = airQualityData.current.ozone;
    const pm25 = airQualityData.current.pm2_5;

    document.getElementById("aqiValue").textContent = aqi;
    document.getElementById("aqiText").textContent = getAQIDescription(aqi);
    document.getElementById("aqiO3").textContent = o3
      ? `${Math.round(o3)} μg/m³`
      : "--";
    document.getElementById("aqiPm25").textContent = pm25
      ? `${Math.round(pm25)} μg/m³`
      : "--";

    renderGauge("aqiGauge", aqi, 100, getAQIColor(aqi));
  }

  // 8. Sun Graph & Times
  const sunrise = new Date(daily.sunrise[0]);
  const sunset = new Date(daily.sunset[0]);
  document.getElementById("sunrise").textContent = formatTime(sunrise);
  document.getElementById("sunset").textContent = formatTime(sunset);
  renderSunGraph("sunGraph", sunrise, sunset);

  // 9. Moon Phase
  const moonPhase = getMoonPhase(new Date());
  renderMoonPhase("moonIcon", moonPhase);
  document.getElementById("moonPhase").textContent = moonPhase.name;

  // 10. Precipitation
  const precipElement = document.getElementById("precipitation");
  if (precipElement) {
    precipElement.textContent = `${current.precipitation}mm`;
  }
}



// Re-implement updateHourlyForecast (keeping it simple as it was mostly fine)
function updateHourlyForecast() {
  if (!weatherData || !weatherData.hourly) return;
  const hourly = weatherData.hourly;
  elements.hourlyForecast.innerHTML = "";

  let startIndex = 0;
  const hoursToShow = 24;

  if (selectedDay === 0) {
    // TODAY: Start from current hour
    const nowISO = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const currentHourIndex = hourly.time.findIndex((t) => t.startsWith(nowISO));
    startIndex = currentHourIndex !== -1 ? currentHourIndex : 0;
  } else {
    // FUTURE DAY: Start from 00:00 of that day
    // We can assume the API returns hourly data starting from today at 00:00 or current hour?
    // Open-Meteo usually aligns with local time if timezone=auto, but let's be safe.
    // The 'daily' array aligns with 'selectedDay'.
    // We need to find the hourly index corresponding to the start of the selected day.
    
    // Get the date string for the selected day from daily data
    if (weatherData.daily && weatherData.daily.time[selectedDay]) {
        const targetDate = weatherData.daily.time[selectedDay]; // YYYY-MM-DD
        startIndex = hourly.time.findIndex(t => t.startsWith(targetDate));
        if (startIndex === -1) startIndex = 0; // Fallback
    }
  }

  // Iterate to show 24 hours (or available hours)
  for (let i = startIndex; i < startIndex + hoursToShow && i < hourly.time.length; i++) {
    const time = new Date(hourly.time[i]);
    const weatherInfo = getWeatherInfo(hourly.weather_code[i]);
    
    // Check if this is "Now" (only relevant for Today view)
    const isNow = selectedDay === 0 && i === startIndex;

    const item = document.createElement("div");
    item.className = "hourly-item";
    item.innerHTML = `
            <div class="hourly-time">${isNow ? "Now" : formatTime(time)}</div>
            <div class="hourly-icon"><img src="${weatherInfo.icon(true)}" width="40"></div>
            <div class="hourly-temp">${Math.round(hourly.temperature_2m[i])}°</div>
            <div class="hourly-pop">💧 ${hourly.precipitation_probability[i]}%</div>
            <div class="hourly-wind">💨 ${Math.round(hourly.wind_speed_10m[i])}km/h</div>
        `;
    elements.hourlyForecast.appendChild(item);
  }
}

function updateDaySelector() {
  elements.daySelectors.forEach((btn) => {
    btn.classList.toggle("active", parseInt(btn.dataset.day) === selectedDay);
  });
}

function updateDayButtons() {
  if (!weatherData || !weatherData.daily) return;
  const daily = weatherData.daily;

  elements.daySelectors.forEach((btn, index) => {
    if (index >= daily.time.length) return;

    if (index === 0) btn.textContent = "Today";
    else if (index === 1) btn.textContent = "Tomorrow";
    else {
      const date = new Date(daily.time[index]);
      btn.textContent = formatDayName(date);
    }
  });
}

function updateExtendedForecast() {
  if (!weatherData || !weatherData.daily) return;
  const daily = weatherData.daily;
  if (elements.extendedGrid) elements.extendedGrid.innerHTML = "";

  // Show all available days (up to 16)
  const daysToShow = daily.time.length;

  for (let i = 0; i < daysToShow; i++) {
    const card = document.createElement("div");
    card.className = "extended-card";
    
    const date = new Date(daily.time[i]);
    const isToday = i === 0;

    if (isToday) card.classList.add("is-today");

    const weatherInfo = getWeatherInfo(daily.weather_code[i]);
    const rainProb = daily.precipitation_probability_max ? Math.round(daily.precipitation_probability_max[i]) : 0;

    card.innerHTML = `
        <div class="extended-date">${formatShortDate(date)}</div>
        <div class="extended-day">${formatDayName(date)}</div>
        <div class="extended-icon">
            <img src="${weatherInfo.icon(true)}" alt="${weatherInfo.description}">
        </div>
        <div class="extended-temps">
            <span class="extended-high">${Math.round(daily.temperature_2m_max[i])}°</span>
            <span class="extended-low">${Math.round(daily.temperature_2m_min[i])}°</span>
        </div>
        <div class="extended-rain">
            <span>💧</span>
            <span>${rainProb}%</span>
        </div>
        <div class="extended-wind">
            <span>💨</span>
            <span>${Math.round(daily.wind_speed_10m_max[i])}km/h</span>
        </div>
    `;
    elements.extendedGrid.appendChild(card);
  }
}

// ==================== Visualization Rendering ====================

// --- Gauge Renderer (Canvas) ---
function renderGauge(canvasId, value, max, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.4;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Background Arc (135deg to 45deg, clockwise)
  // Angles in radians: 135deg = 0.75 * PI, 45deg = 0.25 * PI (looping around)
  // Easy way: 135deg start, 405deg end.
  const startAngle = 0.75 * Math.PI;
  const endAngle = 2.25 * Math.PI;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.stroke();

  // Value Arc
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const valueEndAngle = startAngle + (endAngle - startAngle) * percentage;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, valueEndAngle);
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.stroke();
}

// --- Sun Graph Renderer (Sine Wave) ---
function renderSunGraph(canvasId, sunrise, sunset) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const now = new Date();

  // Normalize time to 0-1 range for the graph (say, 4am to 10pm window)
  const viewStart = new Date(sunrise);
  viewStart.setHours(sunrise.getHours() - 2); // Start 2 hours before sunrise
  const viewEnd = new Date(sunset);
  viewEnd.setHours(sunset.getHours() + 2); // End 2 hours after sunset

  const totalDuration = viewEnd - viewStart;

  // Helper to get X position
  const getX = (date) => {
    const diff = date - viewStart;
    return (diff / totalDuration) * w;
  };

  // Draw horizon line
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.moveTo(0, h * 0.8);
  ctx.lineTo(w, h * 0.8);
  ctx.stroke();

  const riseX = getX(sunrise);
  const setX = getX(sunset);

  // Draw Daylight Curve (Parabola-ish)
  ctx.beginPath();
  ctx.moveTo(riseX, h * 0.8);
  ctx.quadraticCurveTo((riseX + setX) / 2, h * 0.1, setX, h * 0.8);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffd700"; // Gold
  ctx.stroke();

  // Draw Sun Position
  if (now >= viewStart && now <= viewEnd) {
    const nowX = getX(now);
    // Calculate Y on the curve
    // Using simplified quadratic logic:
    const t = (nowX - riseX) / (setX - riseX);
    let sunY = h * 0.8;

    if (t >= 0 && t <= 1) {
      // Bezier height at t
      sunY =
        Math.pow(1 - t, 2) * h * 0.8 +
        2 * (1 - t) * t * h * 0.1 +
        Math.pow(t, 2) * h * 0.8;
    } else {
      // Below horizon or out of view
      sunY = h * 0.8;
    }

    // Draw Sun
    ctx.beginPath();
    ctx.arc(nowX, sunY, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ffd700";
  }
}

// --- Moon Phase Renderer ---
function getMoonPhase(date) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (month < 3) {
    year--;
    month += 12;
  }

  ++month;
  let c = 365.25 * year;
  let e = 30.6 * month;
  let jd = c + e + day - 694039.09; // jd is total days elapsed
  jd /= 29.5305882; // divide by the moon cycle
  let b = parseInt(jd); // int(jd) -> b, take integer part of jd
  jd -= b; // subtract integer part to leave fractional part of original jd
  b = Math.round(jd * 8); // scale fraction from 0-8 and round

  if (b >= 8) b = 0; // 0 and 8 are the same so turn 8 into 0

  const phases = {
    0: "New Moon",
    1: "Waxing Crescent",
    2: "First Quarter",
    3: "Waxing Gibbous",
    4: "Full Moon",
    5: "Waning Gibbous",
    6: "Last Quarter",
    7: "Waning Crescent",
  };

  return { index: b, name: phases[b] };
}

function renderMoonPhase(containerId, phase) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let path = "";
  // Full Moon
  if (phase.index === 4)
    path = '<circle cx="32" cy="32" r="28" fill="#f0f0f0" />';
  // New Moon
  else if (phase.index === 0)
    path = '<circle cx="32" cy="32" r="28" fill="#333" stroke="#555" />';
  // Crescent/Quarter approximation
  else
    path = `<circle cx="32" cy="32" r="28" fill="#333" stroke="#555" /><text x="32" y="38" font-size="24" fill="white" text-anchor="middle" font-weight="bold">${
      ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"][phase.index]
    }</text>`;

  container.innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64">${path}</svg>`;
}

// ==================== Helpers ====================
function getCardinalDirection(angle) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(angle / 45) % 8];
}

function getVisibilityDescription(km) {
  if (km >= 10) return "Excellent";
  if (km >= 5) return "Good";
  if (km >= 2) return "Moderate";
  return "Poor";
}

function getUVDescription(uv) {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

function getUVColor(uv) {
  if (uv <= 2) return "#55efc4"; // Green-ish
  if (uv <= 5) return "#ffeaa7"; // Yellow-ish
  if (uv <= 7) return "#fdcb6e"; // Orange
  if (uv <= 10) return "#ff7675"; // Red
  return "#6c5ce7"; // Purple
}

function getAQIDescription(aqi) {
  if (aqi <= 20) return "Good";
  if (aqi <= 40) return "Fair";
  if (aqi <= 60) return "Moderate";
  if (aqi <= 80) return "Poor";
  if (aqi <= 100) return "Very Poor";
  return "Hazardous";
}

function getAQIColor(aqi) {
  if (aqi <= 20) return "#55efc4";
  if (aqi <= 40) return "#81ecec";
  if (aqi <= 60) return "#ffeaa7";
  if (aqi <= 80) return "#fdcb6e";
  if (aqi <= 100) return "#ff7675";
  return "#2d3436";
}

// Include existing date formatters
function formatDate(date) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

function formatShortDate(date) {
  const options = { month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function formatDayName(date) {
  const options = { weekday: "short" };
  return date.toLocaleDateString("en-US", options);
}

function formatTime(date) {
  const options = { hour: "2-digit", minute: "2-digit", hour12: true };
  return date.toLocaleTimeString("en-US", options);
}

function getWeatherInfo(code) {
  // Basic mapping for brevity, assuming standard WMO codes
  // 0: Clear, 1-3: Cloud, 45/48: Fog, 51-67: Rain/Drizzle, 71-77: Snow, 80-82: Showers, 95-99: Thunder
  const weatherCodes = {
    0: {
      main: "Clear",
      description: "Clear sky",
      icon: (d) =>
        `https://openweathermap.org/img/wn/${d ? "01d" : "01n"}@4x.png`,
    },
    1: {
      main: "Clear",
      description: "Mainly clear",
      icon: (d) =>
        `https://openweathermap.org/img/wn/${d ? "01d" : "01n"}@4x.png`,
    },
    2: {
      main: "Clouds",
      description: "Partly cloudy",
      icon: (d) =>
        `https://openweathermap.org/img/wn/${d ? "02d" : "02n"}@4x.png`,
    },
    3: {
      main: "Clouds",
      description: "Overcast",
      icon: (d) => `https://openweathermap.org/img/wn/03d@4x.png`,
    },
    45: {
      main: "Fog",
      description: "Foggy",
      icon: (d) => `https://openweathermap.org/img/wn/50d@4x.png`,
    },
    48: {
      main: "Fog",
      description: "Rime fog",
      icon: (d) => `https://openweathermap.org/img/wn/50d@4x.png`,
    },
    51: {
      main: "Drizzle",
      description: "Light drizzle",
      icon: (d) => `https://openweathermap.org/img/wn/09d@4x.png`,
    },
    53: {
      main: "Drizzle",
      description: "Moderate drizzle",
      icon: (d) => `https://openweathermap.org/img/wn/09d@4x.png`,
    },
    55: {
      main: "Drizzle",
      description: "Dense drizzle",
      icon: (d) => `https://openweathermap.org/img/wn/09d@4x.png`,
    },
    61: {
      main: "Rain",
      description: "Slight rain",
      icon: (d) => `https://openweathermap.org/img/wn/10d@4x.png`,
    },
    63: {
      main: "Rain",
      description: "Moderate rain",
      icon: (d) => `https://openweathermap.org/img/wn/10d@4x.png`,
    },
    65: {
      main: "Rain",
      description: "Heavy rain",
      icon: (d) => `https://openweathermap.org/img/wn/10d@4x.png`,
    },
    71: {
      main: "Snow",
      description: "Slight snow",
      icon: (d) => `https://openweathermap.org/img/wn/13d@4x.png`,
    },
    73: {
      main: "Snow",
      description: "Moderate snow",
      icon: (d) => `https://openweathermap.org/img/wn/13d@4x.png`,
    },
    75: {
      main: "Snow",
      description: "Heavy snow",
      icon: (d) => `https://openweathermap.org/img/wn/13d@4x.png`,
    },
    80: {
      main: "Rain",
      description: "Rain showers",
      icon: (d) => `https://openweathermap.org/img/wn/09d@4x.png`,
    },
    81: {
      main: "Rain",
      description: "Mod. showers",
      icon: (d) => `https://openweathermap.org/img/wn/09d@4x.png`,
    },
    82: {
      main: "Rain",
      description: "Violent showers",
      icon: (d) => `https://openweathermap.org/img/wn/09d@4x.png`,
    },
    95: {
      main: "Thunderstorm",
      description: "Thunderstorm",
      icon: (d) => `https://openweathermap.org/img/wn/11d@4x.png`,
    },
    96: {
      main: "Thunderstorm",
      description: "T-storm & hail",
      icon: (d) => `https://openweathermap.org/img/wn/11d@4x.png`,
    },
    99: {
      main: "Thunderstorm",
      description: "Heavy hail",
      icon: (d) => `https://openweathermap.org/img/wn/11d@4x.png`,
    },
  };
  return weatherCodes[code] || weatherCodes[0];
}

function updateBackground(weatherMain, isDay) {
  const body = document.body;
  const gradients = {
    Clear: isDay
      ? "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)"
      : "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    Clouds: isDay
      ? "linear-gradient(135deg, #4b6cb7 0%, #182848 100%)"
      : "linear-gradient(135deg, #232526 0%, #414345 100%)",
    Rain: "linear-gradient(135deg, #283048 0%, #859398 100%)",
    Thunderstorm: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
    Snow: "linear-gradient(135deg, #e6dada 0%, #274046 100%)",
    Fog: "linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)",
  };
  body.style.background = gradients[weatherMain] || gradients.Clear;
}

function showLoading() {
  elements.loadingSpinner.style.display = "block";

  // Hide details but keep structure logic if needed, but for now just toggle content
  if (elements.currentWeatherContent) {
    elements.currentWeatherContent.style.visibility = "hidden";
    elements.currentWeatherContent.style.display = "none";
  }
}

function hideLoading() {
  elements.loadingSpinner.style.display = "none";
  if (elements.currentWeatherContent) {
    elements.currentWeatherContent.style.visibility = "visible";
    elements.currentWeatherContent.style.display = "block";
  }
}

function showError(message) {
  elements.errorText.textContent = message;
  elements.errorMessage.style.display = "flex";
  setTimeout(() => hideError(), 5000);
}

function hideError() {
  elements.errorMessage.style.display = "none";
}
