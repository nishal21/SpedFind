<div align="center">
  <h1>🚀 SPEDFIND.</h1>
  <p><b>Pro-Grade Network Diagnostics & Telemetry</b></p>
  <p>A highly accurate, free, and open-source internet speed test tool featuring a stunning Neo-Brutalist Cyber-HUD and a beautiful Terminal Dashboard.</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
  [![Tailwind v4](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Python](https://img.shields.io/badge/Python-3.10+-FFD43B?logo=python&logoColor=blue)](https://python.org/)
</div>

---

## ✨ Features

### 🌐 Web Dashboard (React + Tailwind v4)
- **Neo-Brutalist Cyber-HUD:** An immersive, high-performance UI designed for network professionals.
- **Live Telemetry:** Real-time SVG charting of downstream and upstream data.
- **Advanced Diagnostics:** Measures Ping, Jitter, Packet Loss, and exact Data Consumption in MB.
- **Identity Vectoring:** Pinpoint-accurate ISP, ASN, and geographic location mapping (powered by IPinfo/MaxMind databases).
- **Network Grading System:** Automatically evaluates your connection and assigns a grade (S, A, B, C, F) alongside use-case suitability (e.g., 8K Streaming, E-Sports).
- **Export to Clipboard:** Instantly format and copy your network telemetry for ISP support tickets.

### 💻 Command-Line Interface (Python + Rich)
- **Terminal Dashboard:** A beautifully animated `rich` console interface.
- **Real-Time Morphing:** In-place UI updates without spamming your terminal.
- **Ookla Core Integration:** Uses the global speedtest network for highly accurate latency and bandwidth metrics directly from the command line.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS v4
- **Backend API:** Python, FastAPI (Custom stream engine for payload testing)
- **CLI:** Python, `rich`, `speedtest-cli`, `httpx`
- **Geolocation:** `ipinfo.io` (Primary) & `ip-api` (Fallback)

---

## 🚀 Getting Started

### 1. Web Application
Start the custom FastAPI testing backend and the Vite frontend:

```bash
# 1. Install Backend Dependencies & Start Server
pip install fastapi uvicorn httpx
python -m uvicorn api.main:app --reload --port 8000

# 2. Install Frontend Dependencies & Start Server
cd web
npm install
npm run dev
```
*Navigate to `http://localhost:5173` to view the HUD.*

### 2. Terminal CLI
Run the standalone animated terminal tool:

```bash
# Install CLI dependencies
pip install rich speedtest-cli httpx

# Run the CLI dashboard
python cli/spedfind.py
```

---

## 🌍 Live Demo
The frontend is hosted via GitHub Pages at: **[https://nishal21.github.io/SpedFind/](https://nishal21.github.io/SpedFind/)**

*(Note: For the web interface to test real-world internet speed rather than loopback speed, the FastAPI backend must be hosted on a cloud provider like Render, Vercel, or a VPS).*

---

## 📄 License
This project is 100% free and open-source under the **MIT License**. No paid API keys are required to run or self-host this application.
