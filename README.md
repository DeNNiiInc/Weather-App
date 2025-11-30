# Weather Pro - Professional Weather Application

A beautiful, modern weather application with geolocation support, 7-day forecasts, and detailed hourly breakdowns.

## ✨ No API Key Required!

This app uses **Open-Meteo API** which is completely free and requires **NO registration or API key**. Just open the HTML file and it works immediately!

## Features

🎨 **Modern Design**
- Glassmorphism UI effects
- Dynamic gradient backgrounds that change based on weather conditions
- Smooth animations and transitions
- Fully responsive design

🌍 **Location Support**
- Automatic geolocation detection
- Search for any city worldwide
- Current location as default option

📊 **Comprehensive Weather Data**
- Current weather conditions
- Temperature, feels like, humidity, wind speed
- Pressure, visibility, sunrise/sunset times
- 7-day forecast with daily summaries
- Hour-by-hour breakdown for each day
- Precipitation probability
- Weather icons and descriptions

## Quick Start

**No setup required!** Simply:

1. Open `index.html` in your web browser
2. Allow location access when prompted (or search for a city)
3. Enjoy your weather forecast!

That's it! No API keys, no registration, no configuration needed.

## Usage

### Search for a City
1. Type a city name in the search box
2. Click the search button or press Enter
3. Weather data will update for the selected city

### Use Current Location
- Click the location button (📍) to refresh with your current location
- On first load, the app automatically requests your location

### View Hourly Forecast
1. The hourly forecast shows detailed hour-by-hour data
2. Click the day selector buttons (Today, Tomorrow, Day 3, etc.) to view hourly data for different days
3. Scroll horizontally to see all hours for the selected day

### Weather Details
Each forecast includes:
- Temperature (high/low for daily, specific for hourly)
- Weather conditions and description
- Humidity percentage
- Wind speed
- Precipitation probability (hourly)
- Weather icons

## About Open-Meteo API

This app uses [Open-Meteo](https://open-meteo.com/), a free weather API that:

✅ **Completely free** - No credit card required  
✅ **No registration** - No API key needed  
✅ **10,000 requests per day** - More than enough for personal use  
✅ **7-day forecast** - With hourly data  
✅ **High quality data** - Reliable weather information  

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Opera

**Requirements:**
- JavaScript enabled
- Geolocation API support (for location features)
- Internet connection

## Privacy

This application:
- Only requests location data when you click the location button or on initial load
- Does not store or transmit your location data except to Open-Meteo API for weather data
- Does not use cookies or local storage
- Does not track user behavior
- Is completely client-side (no backend server)

## Troubleshooting

### "Unable to get your location" error
- Make sure you've allowed location access in your browser
- Try searching for a city manually instead
- The app will fall back to London if location access is denied

### "City not found" error
- Check the spelling of the city name
- Try adding the country name (e.g., "Paris, France")
- Some small cities may not be in the database

### Weather data not loading
- Check your internet connection
- Try refreshing the page
- Make sure JavaScript is enabled in your browser

### Blank or broken display
- Make sure all three files (index.html, style.css, script.js) are in the same folder
- Try clearing your browser cache
- Check the browser console for any errors (F12)

## Technical Details

### Files
- `index.html` - Main HTML structure
- `style.css` - Styling and animations
- `script.js` - Weather data fetching and UI logic
- `README.md` - This file

### APIs Used
- **Open-Meteo Weather API** - Weather data
- **Open-Meteo Geocoding API** - City search and reverse geocoding
- **Browser Geolocation API** - Current location detection

### Weather Codes
The app uses WMO Weather interpretation codes to display accurate weather conditions and appropriate icons for:
- Clear skies
- Clouds (partly cloudy, overcast)
- Rain (light, moderate, heavy)
- Snow
- Thunderstorms
- Fog and mist
- Drizzle

## Credits

- Weather data provided by [Open-Meteo](https://open-meteo.com/)
- Weather icons from [OpenWeatherMap](https://openweathermap.org/)
- Font: [Inter](https://fonts.google.com/specimen/Inter) from Google Fonts

## License

This project is open source and available for personal and commercial use.

---

**Enjoy your weather forecast! 🌤️**
