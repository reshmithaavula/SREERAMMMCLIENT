const fs = require('fs');
const path = require('path');

const filesToDel = [
    "check_db_status.js", "check_db_v2.js", "check_lock.js", "db_diag.js",
    "diag.py", "diag_v3.py", "diagnose_engine.js", "quick_db_check.js",
    "test_db.py", "check_db_integrity.py", "RUTHLESS_AUDIT.py",
    "SUPER_FIX_LAG.py", "BOT_FIX_SUMMARY.md", "test_polygon.js",
    "test_require.js", "test_minimal.js", "minimal_success.txt",
    "minimal_fail.txt", "header_service.log", "cleanup_project.py"
];

filesToDel.forEach(f => {
    try {
        if (fs.existsSync(f)) {
            fs.unlinkSync(f);
            console.log('Deleted ' + f);
        }
    } catch (e) {
        console.error('Err ' + f + ': ' + e.message);
    }
});

const webScriptsDir = path.join('web', 'scripts');
const webScriptsToDel = [
    "check-database.js", "check-engine-db.js", "check_categories.js",
    "check_db_file.js", "check_live_status.js", "debug_movers.js",
    "diagnose.ts", "ingest.ts", "inject_test_data.js",
    "populate-sample-data.js", "verify_db.js", "optimize-production-db.js"
];

webScriptsToDel.forEach(f => {
    try {
        const p = path.join(webScriptsDir, f);
        if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            console.log('Deleted ' + p);
        }
    } catch (e) {
        console.error('Err ' + f + ': ' + e.message);
    }
});
