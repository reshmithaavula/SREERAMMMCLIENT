import time
import logging
import sqlite3 as sl
import pandas as pd
from datetime import date, datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('analysis_agent.log')
    ]
)
logger = logging.getLogger("analysis-agent")

DB_PATH = '../../market_v3.db'

def percentchange(old, new):
    if old == 0:
        return 0.0
    return round((new - old) / old * 100, 2)

def main():
    logger.info("Starting Analysis Agent")
    
    # Use a timeout to handle transient locks and enable WAL mode for concurrency
    con = sl.connect(DB_PATH, timeout=30)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA busy_timeout=30000")
    
    # Create results table
    # This is where the 'database is locked' error often happens during initial boot
    try:
        con.execute("""
            CREATE TABLE IF NOT EXISTS market_movers_python (
                timestamp TEXT,
                category TEXT,
                ticker TEXT,
                price REAL,
                change REAL,
                change_percent REAL
            )
        """)
    except sl.OperationalError as e:
        if "locked" in str(e):
            logger.error("Database is locked. Retrying in 5 seconds...")
            time.sleep(5)
            # Re-run create table
            con.execute("CREATE TABLE IF NOT EXISTS market_movers_python (timestamp TEXT, category TEXT, ticker TEXT, price REAL, change REAL, change_percent REAL)")
        else:
            raise e
    
    while True:
        try:
            now = datetime.now()
            today = date.today()
            cb_date = today.strftime("%b-%d-%Y")
            cbucket = now.hour * 60 + now.minute
            
            logger.info("Running analysis...")
            
            # Get distinct tickers
            cur = con.cursor()
            tickers = [row[0] for row in cur.execute("SELECT distinct tckr FROM stks").fetchall()]
            
            movers = []
            
            for ticker in tickers:
                # Get max bucket for this ticker today
                maxbucket_query = f"SELECT max(cbucket) FROM stks where tckr ='{ticker}' and cb_date == '{cb_date}'"
                res = cur.execute(maxbucket_query).fetchone()
                if not res or res[0] is None:
                    continue
                mstkscbucket = res[0]
                
                # Get current price
                latest_query = f"SELECT idv_regularMarketPrice FROM stks Where tckr == '{ticker}' and cb_date == '{cb_date}' and cbucket <= {mstkscbucket} order by cbucket desc, ts desc LIMIT 1"
                res = cur.execute(latest_query).fetchone()
                if not res:
                    continue
                current_price = res[0]
                
                # Helper to get price at offset
                def get_price_at_offset(offset):
                    bucket = mstkscbucket - offset
                    query = f"SELECT idv_regularMarketPrice FROM stks where tckr == '{ticker}' and cb_date == '{cb_date}' and cbucket <= {bucket} order by cbucket desc, ts desc LIMIT 1"
                    tup = cur.execute(query).fetchone()
                    return tup[0] if tup else None

                # 1 Min Analysis (Offset 2 buckets approx)
                price_1min_ago = get_price_at_offset(2)
                if price_1min_ago:
                    pct = percentchange(price_1min_ago, current_price)
                    change = current_price - price_1min_ago
                    if pct > 1:
                        movers.append((now.isoformat(), 'OneMinRip', ticker, current_price, change, pct))
                    elif pct < -1:
                        movers.append((now.isoformat(), 'OneMinDip', ticker, current_price, change, pct))

                # 5 Min Analysis (Offset 5 buckets)
                price_5min_ago = get_price_at_offset(5)
                if price_5min_ago:
                    pct = percentchange(price_5min_ago, current_price)
                    change = current_price - price_5min_ago
                    if pct > 2:
                        movers.append((now.isoformat(), 'FiveMinRip', ticker, current_price, change, pct))
                    elif pct < -2:
                        movers.append((now.isoformat(), 'FiveMinDip', ticker, current_price, change, pct))

            # Insert results
            if movers:
                logger.info(f"Found {len(movers)} movers")
                con.executemany("INSERT INTO market_movers_python VALUES (?,?,?,?,?,?)", movers)
                con.commit()
            else:
                logger.info("No movers found this cycle")
                
            time.sleep(60) # Run every minute
            
        except Exception as e:
            logger.error(f"Error in analysis loop: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
