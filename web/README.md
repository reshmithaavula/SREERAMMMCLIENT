# StockTrack - Real-Time Dashboard

This is the front-end dashboard for the StockTrack system, built with Next.js 15+, React 19, and Tailwind CSS.

## Features

- **Real-Time Data**: WebSocket-driven price updates and news feed.
- **Market Intelligence**: Integrated ticker search with direct links to Yahoo Finance and CNBC.
- **Top Rippers & Dippers**: Dynamic tables showing top market gainers and losers across different timeframes.
- **Portfolio Tracking**: Manage your holdings and view real-time valuation changes.
- **Sector Analysis**: High-level sector performance overview.

## Prerequisites

- **Node.js 20+**
- **Python 3.10+** (if running the full engine)
- **C++ Build Tools** (Required for compiling the `better-sqlite3` native dependency)

## Installation

Run the following command in this directory:

```bash
npm install
```

If you encounter issues with the database connection, rebuild the native modules:

```bash
npm rebuild better-sqlite3
```

## Environment Setup

Create a `.env.local` file in this directory (or use the `.env` at the root):

```env
POLYGON_API_KEY=your_key_here
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Running the Application

### Core Development
```bash
npm run dev
```

### Full System (Dashboard + Scrapers + Real-Time Engine)
If you are running the complete system, use the master startup script in the parent directory:
`../1_STARTUP_HUB/01_MASTER_START.bat`

## Deployment

To create a production build:

```bash
npm run build
```

The optimized application can then be started with `npm run start`.
