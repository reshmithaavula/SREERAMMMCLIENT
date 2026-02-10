import sqlite3
import pandas as pd
import os
import json
from datetime import datetime

db_path = 'market_v3.db'
report = []

def log(msg, status="INFO"):
    report.append(f"[{status}] {msg}")
    print(f"[{status}] {msg}")

def check_db():
    if not os.path.exists(db_path):
        log("Database file market_v3.db MISSING!", "CRITICAL")
        return False
    
    try:
        con = sqlite3.connect(db_path)
        
        # Check System Status
        try:
            status = pd.read_sql("SELECT * FROM system_status", con)
            log(f"System Status Keys: {status['key'].tolist()}")
            if 'latest_ts' in status['key'].values:
                ts = status[status['key']=='latest_ts']['value'].values[0]
                log(f"Latest Engine Timestmap: {ts}", "OK")
            else:
                log("System Status missing 'latest_ts' - Engine might be stuck.", "WARNING")
        except:
             log("Table 'system_status' not found or empty.", "CRITICAL")

        # Check Stks (Live Quotes)
        try:
            stks_count = con.execute("SELECT count(*) FROM stks").fetchone()[0]
            log(f"Live Quotes (stks) count: {stks_count}", "INFO")
            if stks_count == 0:
                log("Live Quotes table is EMPTY. Dashboard will show nothing.", "CRITICAL")
        except:
            log("Table 'stks' missing.", "CRITICAL")

        # Check Market Movers (Rippers/Dippers)
        try:
            movers_count = con.execute("SELECT count(*) FROM market_movers").fetchone()[0]
            log(f"Market Movers count: {movers_count}", "INFO")
            if movers_count == 0:
                log("Market Movers table is EMPTY. Rippers/Dippers panels will be blank.", "CRITICAL")
            else:
                types = pd.read_sql("SELECT DISTINCT type FROM market_movers", con)['type'].tolist()
                log(f"Mover Types found: {types}", "OK")
        except:
            log("Table 'market_movers' missing.", "CRITICAL")
            
        # Check News
        try:
            news_count = con.execute("SELECT count(*) FROM news").fetchone()[0]
            log(f"News items: {news_count}", "INFO")
        except:
            log("Table 'news' missing.", "WARNING")

        con.close()
        return True
    except Exception as e:
        log(f"Database connection failed: {e}", "CRITICAL")
        return False

def check_portfolio():
    if os.path.exists('portfolio.csv'):
        try:
            df = pd.read_csv('portfolio.csv')
            if df.empty:
                log("portfolio.csv is EMPTY. User portfolio will be blank.", "WARNING")
            else:
                cols = df.columns.tolist()
                expected = ['ticker', 'bought_price', 'shares']
                if not all(col in cols for col in expected):
                     log(f"portfolio.csv has wrong columns: {cols}. Expected {expected}", "CRITICAL")
                else:
                    log(f"Portfolio loaded: {len(df)} tickers.", "OK")
        except Exception as e:
            log(f"Failed to read portfolio.csv: {e}", "CRITICAL")
    else:
        log("portfolio.csv MISSING. Portfolio feature will fail.", "CRITICAL")

def check_bot_status():
    path = 'web/data/bot-status.json'
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                data = json.load(f)
            log(f"Bot Status: {data.get('status')} | Tweets: {data.get('tweetCount')}", "INFO")
        except:
            log("bot-status.json is corrupt.", "WARNING")
    else:
        log("bot-status.json missing (Bot might never have run).", "WARNING")

print("--- RUTHLESS AUDIT STARTED ---")
check_db()
check_portfolio()
check_bot_status()
print("--- RUTHLESS AUDIT COMPLETE ---")
