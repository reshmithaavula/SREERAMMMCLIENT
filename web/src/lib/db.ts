import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database discovery logic
function findDatabase() {
  const candidates = [
    path.join(process.cwd(), '../market_v3.db'),
    path.join(process.cwd(), 'market_v3.db'),
    path.join(__dirname, '../../../../market_v3.db'),
    path.join(process.env.INIT_CWD || '', '../market_v3.db')
  ];

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      console.log(`[DB] Found database at: ${p}`);
      return p;
    }
  }

  const defaultPath = path.join(process.cwd(), '../market_v3.db');
  if (fs.existsSync(defaultPath)) return defaultPath;

  const localWebPath = path.join(process.cwd(), 'market_v3.db');
  if (fs.existsSync(localWebPath)) return localWebPath;

  return defaultPath;
}

const DB_PATH = findDatabase();

let dbInstance: Database.Database | null = null;
let migrationsRun = false;

export function getDb(readonly: boolean = false) {
  // 1. If we have an instance and migrations have already run, just return it
  if (dbInstance && (readonly || migrationsRun)) {
    return dbInstance;
  }

  // 2. If we don't have an instance, open it
  if (!dbInstance) {
    try {
      console.log(`[DB] Opening connection to ${DB_PATH} (readonly=${readonly})`);
      dbInstance = new Database(DB_PATH, {
        readonly: readonly,
        fileMustExist: false,
        timeout: 60000,
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
      });

      dbInstance.pragma('journal_mode = WAL');
      dbInstance.pragma('synchronous = NORMAL');
      dbInstance.pragma('busy_timeout = 60000');
      dbInstance.pragma('wal_autocheckpoint = 1000');

      console.log(`[DB] Connection successful to: ${DB_PATH}`);
    } catch (e: any) {
      if (e.code === 'ERR_DLOPEN_FAILED' || e.message?.includes('DLOPEN_FAILED') || e.message?.includes('module was compiled')) {
        console.error("[DB] BINARY ERROR DETECTED! Run 'npm rebuild better-sqlite3'");
      } else {
        console.error(`[DB] Connection Failed: ${e.message}`);
      }

      // Final fallback - try without WAL or special pragmas if first try fails
      try {
        dbInstance = new Database(DB_PATH, { fileMustExist: false, readonly });
      } catch (e2: any) {
        console.error(`[DB] Fallback failed: ${e2.message}`);
        throw new Error("Failed to initialize database connection");
      }
    }
  }

  // 3. If we have an instance but migrations haven't run, run them now
  // We only run migrations if we ARE NOT in readonly mode
  if (dbInstance && !migrationsRun && !readonly) {
    try {
      console.log("[DB] Verifying schemas and running migrations...");
      dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS stks (			
              cb_date TEXT NOT NULL,
              cb_datetimeseries TEXT NOT NULL,
              cbucket INTEGER NOT NULL,
              csession TEXT NOT NULL,
              tckr TEXT NOT NULL,
              idv_regularMarketPrice REAL NOT NULL,
              last_trade_size INTEGER,
              onemtsgainer REAL NOT NULL,
              fivemtsgainer REAL NOT NULL,
              thirtymtsgainer REAL NOT NULL,
              fivemtsgain REAL NOT NULL,
              thirtymtsgain REAL NOT NULL,
              onemtsloser REAL NOT NULL,
              fivemtsloser REAL NOT NULL,
              thirtymtsloser REAL NOT NULL,
              fivemtsloss REAL NOT NULL,
              thirtymtsloss REAL NOT NULL,
              todays_change REAL,
              todays_change_percent REAL,
              idv_dayOpen REAL,
              idv_dayHigh REAL,
              idv_dayLow REAL,
              idv_dayClose REAL,
              day_volume REAL,
              idv_prevdayOpen REAL, 
              idv_prevdayClose REAL,
              ts TEXT NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_stks_ts ON stks(ts);
          CREATE INDEX IF NOT EXISTS idx_stks_lookup ON stks(tckr, cb_date, cbucket);

          CREATE TABLE IF NOT EXISTS market_movers (
              type TEXT NOT NULL,
              ticker TEXT NOT NULL, price REAL, change REAL, change_percent REAL,
              updated_at TEXT, session TEXT, common_flag BOOLEAN DEFAULT 0,
              prev_close_gap REAL DEFAULT 0, UNIQUE(type, ticker)
          );

          CREATE TABLE IF NOT EXISTS news (
              id TEXT PRIMARY KEY, publisher TEXT, headline TEXT, author TEXT,
              ts TEXT, url TEXT, image_url TEXT, tickers TEXT
          );

          CREATE TABLE IF NOT EXISTS portfolio (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              ticker TEXT NOT NULL, shares REAL NOT NULL, avg_price REAL NOT NULL,
              current_price REAL, total_value REAL
          );

          CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT, email TEXT UNIQUE NOT NULL, password TEXT, image TEXT,
              role TEXT DEFAULT 'user', created_at TEXT DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS watched_stocks (
              ticker TEXT PRIMARY KEY,
              added_at TEXT DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS ticker_stats (
              ticker TEXT PRIMARY KEY,
              dma_50 REAL,
              swing_avg REAL,
              beta REAL,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
      `);

      // Migration: Add role column if missing from older DBs
      try {
        dbInstance.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
      } catch (e) { }

      migrationsRun = true;
      console.log("[DB] Schema verification and migrations completed.");
    } catch (err: any) {
      console.warn("[DB] Schema verification failed:", err.message);
    }
  }

  return dbInstance;
}

export function getStocksWithMomentum() {
  const db = getDb();
  return db.prepare(`
        SELECT ticker, change_percent as changePercent 
        FROM market_movers 
        WHERE type IN ('day_ripper', 'day_dipper')
        ORDER BY ABS(change_percent) DESC
    `).all() as any[];
}

export function getFastestMovers(limit: number = 5) {
  const db = getDb();
  return db.prepare(`
        SELECT ticker, change_percent as momentum1min
        FROM market_movers
        WHERE type IN ('1m_ripper', '1m_dipper')
        ORDER BY ABS(change_percent) DESC
        LIMIT ?
    `).all(limit) as any[];
}
