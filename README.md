# StockTrack - Real-Time Market Intelligence Dashboard

A professional-grade financial dashboard for real-time stock tracking, algorithmic analysis, and portfolio management. This application integrates a high-speed TypeScript data engine with Python-based AI analysis.

## 🚀 Key Features
- **Ultra-Responsive Price Feed**: Near real-time updates (2-second intervals).
- **Automated Analysis**: Real-time identification of "Rippers" and "Dippers" across multiple timeframes (1m, 5m, 30m, Day).
- **Portfolio Management**: Track holdings, P&L, and daily gains with sub-second navigation.
- **WebSocket Streaming**: Instant data push to the browser via dedicated socket server.
- **Self-Cleaning DB**: Automatic 24-hour data retention to maintain peak performance.

## 🛠 Tech Stack
- **Frontend**: Next.js 16 (React 19), Tailwind CSS, Lucide Icons.
- **Backend (Live Feed)**: TypeScript Node.js engine, Polygon.io API.
- **Analysis**: Python (Pandas, Numpy, SQLite3).
- **Database**: SQLite (WAL Mode enabled for high-concurrency).

## 📥 Setup Instructions

### 1. Prerequisites
- **Node.js 20+**
- **Python 3.10+**
- **Polygon.io API Key** (Free or Pro)

### 2. Environment Setup
Create a `.env.local` file in the `web/` directory:
```env
POLYGON_API_KEY=your_api_key
NEXTAUTH_SECRET=your_random_secret
```

### 3. Installation
```bash
# Install Web dependencies
cd web
npm install

# Install Python dependencies
cd ..
pip install -r requirements.txt
```

### 4. Running the Application
The easiest way to start all services is using the Unified Control Center:
1. Navigate to `1_STARTUP_HUB/`
2. Run `01_MASTER_START.bat`

Alternatively, start services manually:
- **Web UI**: `cd web && npm run dev`
- **Data Engine**: `cd web && npm run engine`
- **WS Server**: `cd web && npm run ws`
- **Analysis Agent**: `cd services/analysis-agent && python main.py`

## 📊 Dashboard Usage
Once started, access the dashboard at: **http://localhost:3000**

## 📄 Troubleshooting

### ❌ "ERR_DLOPEN_FAILED" or "Failed to initialize database"
This happens when you move the project to a new computer. The database library (better-sqlite3) needs to be compiled for your specific PC.
**FIX:** Run `INSTALL_DEPENDENCIES.bat` in the root folder. It will automatically reinstall and rebuild the necessary components.

### ❌ "Invalid source map" or Turbo errors
These can occur if the local cache is corrupted.
**FIX:** The `INSTALL_DEPENDENCIES.bat` script clears these caches for you.

### ❌ News or Price data is not updating
Ensure your `POLYGON_API_KEY` is correctly set in `web/.env.local` and that the `01_MASTER_START.bat` or `03_DATA_ENGINE_TS.bat` window is open and running.

## 📄 License
MIT License - See LICENSE for details.
