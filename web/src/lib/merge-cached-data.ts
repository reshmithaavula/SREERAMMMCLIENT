// Enhanced helper to get recent cached data with smart merging for mover data
// This ensures all timeframes (1min, 5min, 30min, daily) always have data

export function getRecentCachedDataWithMerge(key: string, fallbackData: any) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return fallbackData;
    }

    try {
        const cached = localStorage.getItem(key);
        if (cached) {
            const parsed = JSON.parse(cached);

            // Special handling for dashboardMoverData - merge with fallback
            if (key === 'dashboardMoverData' && parsed && typeof parsed === 'object') {
                console.log(`✓ Merging cached mover data with fallback`);

                // Merge each timeframe - use cached if it has data, otherwise use fallback
                const merged = {
                    m1: {
                        rippers: (parsed.m1?.rippers?.length > 0) ? parsed.m1.rippers : fallbackData.m1.rippers,
                        dippers: (parsed.m1?.dippers?.length > 0) ? parsed.m1.dippers : fallbackData.m1.dippers
                    },
                    m5: {
                        rippers: (parsed.m5?.rippers?.length > 0) ? parsed.m5.rippers : fallbackData.m5.rippers,
                        dippers: (parsed.m5?.dippers?.length > 0) ? parsed.m5.dippers : fallbackData.m5.dippers
                    },
                    m30: {
                        rippers: (parsed.m30?.rippers?.length > 0) ? parsed.m30.rippers : fallbackData.m30.rippers,
                        dippers: (parsed.m30?.dippers?.length > 0) ? parsed.m30.dippers : fallbackData.m30.dippers
                    },
                    day: {
                        rippers: (parsed.day?.rippers?.length > 0) ? parsed.day.rippers : fallbackData.day.rippers,
                        dippers: (parsed.day?.dippers?.length > 0) ? parsed.day.dippers : fallbackData.day.dippers
                    },
                    news: parsed.news || fallbackData.news,
                    quotes: parsed.quotes || fallbackData.quotes,
                    watchlist: parsed.watchlist || fallbackData.watchlist
                };

                return merged;
            }

            // For other data types, use cached if not empty
            if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
                console.log(`✓ Using recent cached data for ${key}`);
                return parsed;
            }
        }
    } catch (e) {
        console.warn(`Failed to load recent cached data for ${key}, using fallback`, e);
    }

    console.log(`Using fallback data for ${key}`);
    return fallbackData;
}
