// Safe localStorage utilities with quota management

/**
 * Safely set an item in localStorage with quota error handling
 * @param key - The localStorage key
 * @param value - The value to store (will be JSON stringified)
 * @returns boolean - true if successful, false if failed
 */
export function safeSetItem(key: string, value: any): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return false;
    }

    try {
        const serialized = JSON.stringify(value);

        // Check if the serialized data is too large (> 1MB)
        const sizeInBytes = new Blob([serialized]).size;
        if (sizeInBytes > 1024 * 1024) {
            console.warn(`Data for key "${key}" is too large (${(sizeInBytes / 1024).toFixed(2)}KB). Skipping cache.`);
            return false;
        }

        localStorage.setItem(key, serialized);
        return true;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded. Clearing old cache...');
            clearOldCacheItems();

            // Try again after clearing
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (retryError) {
                console.error('Failed to cache even after clearing:', retryError);
                return false;
            }
        } else {
            console.error(`Failed to cache "${key}":`, error);
            return false;
        }
    }
}

/**
 * Safely get an item from localStorage
 * @param key - The localStorage key
 * @returns The parsed value or null if not found/error
 */
export function safeGetItem<T = any>(key: string): T | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null;
    }

    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        return JSON.parse(item) as T;
    } catch (error) {
        console.error(`Failed to retrieve "${key}":`, error);
        return null;
    }
}

/**
 * Clear old cache items to free up space
 * Keeps only the most recent/important items
 */
function clearOldCacheItems() {
    const keysToKeep = [
        'dashboardMoverData',
        'dashboardNews',
        'userHoldings'
    ];

    try {
        const allKeys = Object.keys(localStorage);

        // Remove items not in the keep list
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });

        console.log('Cleared old cache items. Kept:', keysToKeep);
    } catch (error) {
        console.error('Failed to clear old cache:', error);
    }
}

/**
 * Get the current localStorage usage
 * @returns Object with used and total bytes
 */
export function getStorageInfo() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return { used: 0, total: 0, percentage: 0 };
    }

    try {
        let used = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage[key].length + key.length;
            }
        }

        // Most browsers have 5-10MB limit, we'll assume 5MB
        const total = 5 * 1024 * 1024;
        const percentage = (used / total) * 100;

        return {
            used,
            total,
            percentage: Math.round(percentage * 100) / 100,
            usedMB: (used / (1024 * 1024)).toFixed(2),
            totalMB: (total / (1024 * 1024)).toFixed(2)
        };
    } catch (error) {
        console.error('Failed to get storage info:', error);
        return { used: 0, total: 0, percentage: 0 };
    }
}

/**
 * Clear all dashboard cache
 */
export function clearDashboardCache() {
    const dashboardKeys = [
        'dashboardData',
        'dashboardMoverData',
        'dashboardQuotes',
        'dashboardGainers',
        'dashboardLosers',
        'dashboardWatchlist',
        'dashboardNews'
    ];

    dashboardKeys.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Failed to remove ${key}:`, error);
        }
    });
}
