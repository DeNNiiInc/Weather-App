# 🌤️ Weather Pro

![Weather Pro Banner](assets/screenshots/dashboard.png)

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Launch%20App-blue?style=for-the-badge&logo=rocket)](https://weather-app.beyondcloud.technology/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

### A Modern, Professional Weather Dashboard
**Precision forecasts, extended outlooks, and localized weather data at your fingertips.**

[**Explore the Live Demo »**](https://weather-app.beyondcloud.technology/)

</div>

---

## ✨ Features

Experience weather tracking like never before with our feature-rich application:

### 🌍 Real-Time Local Weather
Get instant access to current conditions including:
- **Temperature & "Feels Like"**
- **Wind Speed & Direction**
- **UV Index & Humidity**
- **Visibility & Cloud Cover**
- **Sunrise & Sunset Times**
- **Air Quality Index (AQI)**

### ⏱️ Hourly Forecast
Plan your day with precision. Our hourly forecast provides detailed weather breakdowns for the next 24 hours, ensuring you're never caught off guard.

### 📅 16-Day Extended Outlook
Look ahead with confidence. Our comprehensive 16-day forecast grid gives you a clear view of temperature trends and precipitation probabilities for the coming weeks.

![Extended Forecast](assets/screenshots/extended_forecast.png)

### ⚡ Auto-Sync & Version Control
Always running the latest version. The application includes a self-updating mechanism that synchronizes with the GitHub repository, ensuring all users have immediate access to new features and fixes.
- **Live Version Tracking**: See the exact Git commit ID and deployment time in the footer.

### 🎨 Modern & Responsive Design
- **Dark Mode Aesthetic**: Sleek, professional dark theme with glassmorphism effects.
- **Responsive Layout**: Optimized for desktops, tablets, and mobile devices.
- **Dynamic Visuals**: Beautiful weather icons and smooth transitions.

---

## 🚀 Installation & Deployment

Deploy your own instance of Weather Pro in minutes.

### Server Requirements
- **OS**: Ubuntu / Debian (Recommended)
- **Web Server**: NGINX (Preferred) or Apache
- **Permissions**: `sudo` access

### Quick Start (Automated Install)

One command to rule them all. Use our automated installer to set up the environment, configure NGINX, and launch the app.

```bash
# Clone the repository
git clone https://github.com/DeNNiiInc/Weather-App.git
cd Weather-App

# Run the installer (optionally specify a PORT)
# Default is random, or set specific port e.g., 14301
sudo PORT=14301 ./install.sh
```

### Manual Setup
1.  **Clone the Repo**: `git clone https://github.com/DeNNiiInc/Weather-App.git`
2.  **Web Root**: Move files to your web server root (e.g., `/var/www/html/weather-app`).
3.  **Permissions**: Ensure the web user (e.g., `www-data`) has ownership.
4.  **Cron Job**: Setup a cron job for `auto_git_sync.sh` to enable auto-updates.

```bash
*/5 * * * * /path/to/weather-app/auto_git_sync.sh
```

---

## 🛠️ Technology Stack

Built with performance and simplicity in mind, using standard web technologies without heavy framework overhead.

- **Frontend**: HTML5, CSS3 (Variables, Flexbox, Grid), Vanilla JavaScript (ES6+)
- **API**: [Open-Meteo API](https://open-meteo.com/) (No API key required!)
- **Geocoding**: Open-Meteo Geocoding API
- **Icons**: SVG Icons (Feather Icons / Custom)

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions or improvements, please fork the repository and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

<div align="center">

**Developed with ❤️ by [Beyond Cloud Technology](https://beyondcloud.technology)**

</div>
