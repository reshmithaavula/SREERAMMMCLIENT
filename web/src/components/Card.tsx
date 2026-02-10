import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export default function Card({ children, className = '', title }: CardProps) {
    return (
        <div className={`${styles.card} ${className}`}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {children}
        </div>
    );
}
