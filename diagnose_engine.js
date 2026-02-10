const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'market_v3.db');
const db = new Database(dbPath, { readonly: true });

async function check() {
    try {
        const latest = db.prepare('SELECT max(ts) as ts FROM stks').get();
        console.log(`Latest STKS TS: ${latest.ts}`);

        const now = new Date();
        const dbTime = new Date(latest.ts);
        const diffSec = (now.getTime() - dbTime.getTime()) / 1000;
        console.log(`Time diff (sec): ${diffSec.toFixed(1)}`);

        if (diffSec > 60) {
            console.log('ENGINE SEEMS TO BE OFFLINE OR HANGING');
        } else {
            console.log('ENGINE IS WRITING DATA');
        }

        const moverCounts = db.prepare('SELECT type, count(*) as c FROM market_movers GROUP BY type').all();
        console.log('\nMovers Counts:');
        console.table(moverCounts);

        if (moverCounts.length === 0) {
            console.log('WARNING: market_movers table IS EMPTY');
        }

        const watchlistCount = db.prepare('SELECT count(*) as c FROM watched_stocks').get();
        console.log(`\nWatched Stocks Count: ${watchlistCount.c}`);

    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

check();
