# Weather Pro - Professional Weather Application

A beautiful, modern weather application with geolocation support, 7-day forecasts, 16-day extended outlooks, and detailed hourly breakdowns.

![Weather App Preview](https://github.com/DeNNiiInc/Weather-App/raw/main/screenshots/preview.png)

## ✨ Key Features

### 🎨 Modern & Responsive Design
- **Glassmorphism UI**: Premium visual effects with dynamic gradients.
- **Adaptive Backgrounds**: Changes based on current weather conditions (e.g., sunny, rainy, night).
- **Responsive Grid**: Looks great on mobile, tablet, and desktop.

### 📊 Comprehensive Weather Data
- **Current Conditions**: Temperature, feels like, humidity, wind, UV index, and air quality.
- **7-Day Forecast**: Daily summaries with high/lows.
- **16-Day Outlook**: Extended forecast grid with precipitation probability and trends.
- **Hourly Forecast**: Detailed 24-hour breakdown for any selected day.
- **Sun & Moon**: Sunrise/sunset graph and moon phase display.

### 🛠️ Professional Features
- **No API Key Required**: Uses Open-Meteo API (free, no registration).
- **Auto-Location**: Automatically detects user city.
- **Branding**: Custom logo and Git version info in footer.

---

## 🚀 Server Installation (Automated)

You can deploy this application to any Debian/Ubuntu server (including TurnKey Linux NGINX) with a single command. The installer sets up NGINX, permissions, and automatic updates.

### One-Line Installer

```bash
GITHUB_USER="your-email" GITHUB_TOKEN="your-token" curl -sSL https://raw.githubusercontent.com/DeNNiiInc/Weather-App/main/install.sh | bash
```

**What the installer does:**
1.  Clones the repository.
2.  Configures NGINX with caching and gzip compression.
3.  Sets up **Auto-Sync** (updates from GitHub every 5 minutes).
4.  Generates version info for the UI.

### Manual Usage

You can also run the app locally by simply opening `index.html` in your browser. No server required for basic usage!

---

## 🔄 Automatic Updates

The detailed server installation includes an **Auto-Sync** feature.
- A cron job runs every **5 minutes**.
- Checks GitHub for new commits.
- Pulls changes and updates the live site immediately.
- Refreshes the "Git Version" displayed in the app footer.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Variables & Glassmorphism), Vanilla JavaScript (ES6+).
- **Backend (Optional)**: NGINX (Static serving), PHP (Available but not required for core logic).
- **APIs**:
  - [Open-Meteo](https://open-meteo.com/) (Weather Data)
  - [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) (Location Search)

## 📜 License

This project is open source and available for personal and commercial use.

---

**Built with 💙 by DeNNiiInc**
