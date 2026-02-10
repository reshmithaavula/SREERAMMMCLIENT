'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgressBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // When the path or search params change, we've arrived
        setLoading(false);
    }, [pathname, searchParams]);

    useEffect(() => {
        // Add progress bar start logic to all clicks on links
        const handleLinkClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (target && target.href && !target.href.startsWith('#') && !target.target && target.origin === window.location.origin) {
                // Only trigger if it's a different path
                if (target.pathname !== window.location.pathname || target.search !== window.location.search) {
                    setLoading(true);

                    // Failsafe: Stop loading after 5 seconds if navigation stalls or is cancelled
                    setTimeout(() => setLoading(false), 5000);
                }
            }
        };

        document.addEventListener('click', handleLinkClick);
        return () => document.removeEventListener('click', handleLinkClick);
    }, []);

    if (!loading) return null;

    return (
        <div className="fixed top-[56px] md:top-[48px] left-0 right-0 z-[9999] pointer-events-none">
            <div className="h-1 bg-gradient-to-r from-blue-600 via-[#ff5722] to-blue-600 animate-loading-bar shadow-[0_0_10px_rgba(255,87,34,0.5)]"></div>
        </div>
    );
}
