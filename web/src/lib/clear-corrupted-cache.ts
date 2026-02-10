// Auto-clear corrupted cached data with empty mover arrays
// This runs once on page load to fix the "No movers detected" issue

export function clearCorruptedCache() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
    }

    try {
        const cached = localStorage.getItem('dashboardMoverData');
        if (cached) {
            const parsed = JSON.parse(cached);

            // Check if m1 and m5 are empty (corrupted cache)
            const hasEmptyTimeframes = (
                (!parsed.m1?.rippers || parsed.m1.rippers.length === 0) &&
                (!parsed.m1?.dippers || parsed.m1.dippers.length === 0) &&
                (!parsed.m5?.rippers || parsed.m5.rippers.length === 0) &&
                (!parsed.m5?.dippers || parsed.m5.dippers.length === 0)
            );

            if (hasEmptyTimeframes) {
                console.log('🔧 Auto-clearing corrupted cache with empty timeframes');
                localStorage.removeItem('dashboardMoverData');
                localStorage.removeItem('dashboardData');
                console.log('✅ Corrupted cache cleared! Using fallback data.');
                return true; // Cache was cleared
            }
        }
    } catch (e) {
        console.error('Error checking cache:', e);
        // If there's an error, clear it anyway
        localStorage.removeItem('dashboardMoverData');
        localStorage.removeItem('dashboardData');
        return true;
    }

    return false; // Cache was not cleared
}

// Auto-run on import
if (typeof window !== 'undefined') {
    clearCorruptedCache();
}
