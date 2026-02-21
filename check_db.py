import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

con = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = con.cursor()

cur.execute("SELECT COUNT(*) FROM market_movers;")
print("Movers count:", cur.fetchone()[0])
