'use client';

import React from 'react';
export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-full animate-in">
            {children}
        </div>
    );
}
