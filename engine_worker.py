import os
import time
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from polygon import RESTClient
from dotenv import load_dotenv

# ==============================
# LOAD ENV
# ==============================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
API_KEY = os.getenv("API_KEY")

if not DATABASE_URL:
    raise Exception("DATABASE_URL missing in .env")

if not API_KEY:
    raise Exception("API_KEY missing in .env")

client = RESTClient(API_KEY)

# ==============================
# DB CONNECTION
# ==============================

con = psycopg2.connect(DATABASE_URL)
con.autocommit = True
cur = con.cursor()

print("✅ Connected to PostgreSQL")

# ==============================
# CREATE TABLES
# ==============================

cur.execute("""
CREATE TABLE IF NOT EXISTS stks (
    cb_date TEXT,
    cbucket INTEGER,
    session TEXT,
    tckr TEXT,
    price DOUBLE PRECISION,
    day_open DOUBLE PRECISION,
    prev_close DOUBLE PRECISION,
    change_percent DOUBLE PRECISION,
    ts TIMESTAMP
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS market_movers (
    type TEXT,
    ticker TEXT,
    price DOUBLE PRECISION,
    change_percent DOUBLE PRECISION,
    session TEXT,
    updated_at TIMESTAMP,
    PRIMARY KEY (type, ticker)
);
""")

print("✅ Tables verified")

# ==============================
# LOAD WATCHLIST
# ==============================

def load_watchlist():
    try:
        df = pd.read_csv("Watchlist_New.csv")
        return df["Ticker"].dropna().str.upper().unique().tolist()
    except Exception as e:
        print("Watchlist load error:", e)
        return []

# ==============================
# SESSION DETECTOR
# ==============================

def get_session():
    ny = datetime.now(ZoneInfo("America/New_York"))

    if 9 <= ny.hour < 16:
        return "Regular"
    elif 4 <= ny.hour < 9:
        return "Pre-Market"
    elif 16 <= ny.hour < 20:
        return "Post-Market"
    return "Closed"

# ==============================
# SNAPSHOT FETCH + INSERT
# ==============================

def fetch_and_store(stocks):
    session = get_session()
    now = datetime.utcnow()
    cbucket = now.hour * 60 + now.minute
    cb_date = date.today().strftime("%b-%d-%Y")

    snapshots = client.get_snapshot_all("stocks", stocks)

    rows = []

    for s in snapshots:
        if not s.last_trade:
            continue

        price = s.last_trade.price or 0
        day_open = s.day.open if s.day else price
        prev_close = s.prev_day.close if s.prev_day else price

        change_pct = 0
        if prev_close:
            change_pct = ((price - prev_close) / prev_close) * 100

        rows.append((
            cb_date,
            cbucket,
            session,
            s.ticker,
            price,
            day_open,
            prev_close,
            change_pct,
            now
        ))

    if rows:
        execute_values(
            cur,
            """
            INSERT INTO stks
            (cb_date, cbucket, session, tckr, price,
             day_open, prev_close, change_percent, ts)
            VALUES %s
            """,
            rows
        )

        print(f"Inserted {len(rows)} snapshots")

# ==============================
# ROLLING CLEANUP (3 HOURS)
# ==============================

def rolling_cleanup():
    cutoff = datetime.utcnow() - timedelta(hours=3)
    cur.execute("DELETE FROM stks WHERE ts < %s", (cutoff,))
    print("Cleanup complete")

# ==============================
# MOMENTUM ENGINE
# ==============================

def calculate_momentum():
    print("Calculating momentum...")

    cur.execute("""
        SELECT DISTINCT ON (tckr)
        tckr, price, cbucket, day_open, prev_close
        FROM stks
        ORDER BY tckr, ts DESC
    """)
    latest_rows = cur.fetchall()

    if not latest_rows:
        print("No latest rows found")
        return

    movers = []
    now = datetime.utcnow()

    for ticker, price, cbucket, day_open, prev_close in latest_rows:

        def get_price_offset(offset):
            cur.execute("""
                SELECT price FROM stks
                WHERE tckr = %s
                AND cbucket <= %s
                ORDER BY cbucket DESC
                LIMIT 1
            """, (ticker, cbucket - offset))
            row = cur.fetchone()
            return row[0] if row else None

        def pct(old, new):
            if not old:
                return 0
            return ((new - old) / old) * 100

        p1 = get_price_offset(1)
        p5 = get_price_offset(5)
        p30 = get_price_offset(30)

        one_min = pct(p1, price)
        five_min = pct(p5, price)
        thirty_min = pct(p30, price)
        day_change = pct(prev_close, price)

        # Thresholds (can adjust later)
        if one_min > 0.2:
            movers.append(("1m_ripper", ticker, price, one_min))
        if one_min < -0.2:
            movers.append(("1m_dipper", ticker, price, one_min))

        if five_min > 0.5:
            movers.append(("5m_ripper", ticker, price, five_min))
        if five_min < -0.5:
            movers.append(("5m_dipper", ticker, price, five_min))

        if thirty_min > 1:
            movers.append(("30m_ripper", ticker, price, thirty_min))
        if thirty_min < -1:
            movers.append(("30m_dipper", ticker, price, thirty_min))

        if day_change > 2:
            movers.append(("day_ripper", ticker, price, day_change))
        if day_change < -2:
            movers.append(("day_dipper", ticker, price, day_change))

    # Clear old movers
    cur.execute("DELETE FROM market_movers")

    for mtype, ticker, price, change in movers:
        cur.execute("""
            INSERT INTO market_movers
            (type, ticker, price, change_percent, session, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            mtype,
            ticker,
            price,
            change,
            get_session(),
            now
        ))

    print(f"Inserted {len(movers)} movers")

# ==============================
# MAIN LOOP
# ==============================

print("🚀 Engine Started")

while True:
    try:
        stocks = load_watchlist()

        if not stocks:
            print("No stocks found in Watchlist_New.csv")
            time.sleep(30)
            continue

        fetch_and_store(stocks)
        rolling_cleanup()
        calculate_momentum()

        print("Cycle complete. Sleeping 30s...\n")
        time.sleep(30)

    except Exception as e:
        print("Engine Error:", e)
        time.sleep(10)
