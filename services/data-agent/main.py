import os
import time
import logging
import sqlite3 as sl
import pandas as pd
from datetime import date, datetime
from zoneinfo import ZoneInfo
from polygon import RESTClient
import concurrent.futures

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('data_agent.log')
    ]
)
logger = logging.getLogger("data-agent")

# Configuration
API_KEY = 'W2aNiWnMOoP2a04NUgRo8tzFs6B1qQcV'  # Should be in env var
DB_PATH = '../../market_v3.db'
CSV_PATH = '../../Watchlist_New.csv'

def percentchange(old, new):
    if old == 0:
        return 0.0
    return round((new - old) / old * 100, 2)

def insert_stk_info(x, cb_date, cb_datetimeseries, cbucket, csession, now):
    try:
        index, snapshot = x
        dtseries = str(datetime.fromtimestamp(snapshot.updated / 1_000_000_000, tz=ZoneInfo("America/New_York")))
        dtiso = datetime.fromisoformat(dtseries)

        if dtiso.date() == date.today():
            return [(cb_date, dtseries, cbucket, csession, snapshot.ticker, snapshot.last_trade.price,
                     snapshot.last_trade.size, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, snapshot.todays_change,
                     snapshot.todays_change_percent, snapshot.day.open, snapshot.day.high, snapshot.day.low,
                     snapshot.day.close, snapshot.day.volume, snapshot.prev_day.open, snapshot.prev_day.close,
                     now.isoformat())]
    except Exception as e:
        logger.error(f"Unexpected error for {x}: {e}")
    return None

def main():
    logger.info("Starting Data Agent")
    
    # Connect to DB with performance optimizations to avoid locks
    con = sl.connect(DB_PATH, timeout=60.0)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    con.execute("PRAGMA busy_timeout=60000")
    con.execute("PRAGMA cache_size=-100000") # 100MB cache
    
    # Create table if not exists (schema from MainTack.py)
    con.execute("""
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
    """)
    # Add indices if they don't exist
    con.execute("CREATE INDEX IF NOT EXISTS idx_stks_tckr ON stks(tckr)")
    con.execute("CREATE INDEX IF NOT EXISTS idx_stks_ts ON stks(ts)")
    con.commit()
    
    # Load tickers
    try:
        stocks_df = pd.read_csv(CSV_PATH)
        stocks = stocks_df["Ticker"].drop_duplicates().tolist()
        logger.info(f"Loaded {len(stocks)} tickers from CSV")
    except FileNotFoundError:
        logger.warning("CSV not found, using default list")
        stocks = ["AAPL", "MSFT", "GOOG", "TSLA", "NVDA", "AMD"] # Minimal default

    client = RESTClient(API_KEY)
    stkssql = 'INSERT INTO stks (cb_date,cb_datetimeseries,cbucket,csession,tckr,idv_regularMarketPrice,last_trade_size,onemtsgainer,fivemtsgainer,thirtymtsgainer,fivemtsgain,thirtymtsgain,onemtsloser,fivemtsloser,thirtymtsloser,fivemtsloss,thirtymtsloss,todays_change,todays_change_percent,idv_dayOpen,idv_dayHigh,idv_dayLow,idv_dayClose,day_volume,idv_prevdayOpen,idv_prevdayClose,ts) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    while True:
        try:
            now = datetime.now()
            today = date.today()
            cb_date = today.strftime("%b-%d-%Y")
            cb_datetimeseries = now.strftime("%Y-%m-%d %H:%M:00")
            cbucket = now.hour * 60 + now.minute
            
            # Simple session logic
            if 9 <= now.hour < 16:
                csession = 'Regular'
            else:
                csession = 'Extended'

            logger.info(f"Fetching snapshots for {len(stocks)} stocks")
            latest_quotes = client.get_snapshot_all("stocks", stocks)
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                stkresults = executor.map(lambda x: insert_stk_info(x, cb_date, cb_datetimeseries, cbucket, csession, now),
                                          enumerate(latest_quotes))

                data_to_insert = []
                for result in stkresults:
                    if isinstance(result, list):
                        data_to_insert.extend(result)

                if data_to_insert:
                    logger.info(f"Inserting {len(data_to_insert)} records")
                    con.executemany(stkssql, data_to_insert)
                    con.commit()
            
            # Rolling 24h Purge to keep DB light
            one_day_ago = (datetime.now() - pd.Timedelta(days=1)).isoformat()
            con.execute("DELETE FROM stks WHERE ts < ?", (one_day_ago,))
            con.commit()

            logger.info("Cycle complete. Sleeping for 20s")
            time.sleep(20)
            
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            time.sleep(20)

if __name__ == "__main__":
    main()
