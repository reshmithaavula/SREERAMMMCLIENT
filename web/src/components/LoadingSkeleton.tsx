import React from 'react';
import styles from '@/app/page.module.css';

export default function LoadingSkeleton() {
    return (
        <div className={styles.dashboard}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'var(--surface-color)', height: '100px', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ background: 'var(--surface-color)', height: '100px', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
            </div>
            <div style={{ background: 'var(--surface-color)', height: '300px', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
            <style>{`
         @keyframes pulse {
           0% { opacity: 0.6; }
           50% { opacity: 0.3; }
           100% { opacity: 0.6; }
         }
       `}</style>
        </div>
    );
}
