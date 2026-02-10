import React from 'react';
import Card from '@/components/Card';
import styles from './page.module.css';

interface StockDetailProps {
    params: {
        ticker: string;
    };
}

// Placeholder data
const stockData = {
    price: 238.70,
    change: 1.91,
    changePercent: 1.10,
    metrics: {
        volatility: 'High',
        trend: 'Bullish',
        beta: 1.2,
        optionlysis: 'Call Heavy',
        swing: '2.5%',
    },
    historical: {
        high10: 245.00,
        low10: 230.00,
        change10: 5.00,
    },
};

export default function StockDetailPage({ params }: StockDetailProps) {
    const { ticker } = params;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.ticker}>{ticker}</h1>
                <div className={styles.priceBlock}>
                    <span className={styles.price}>${stockData.price.toFixed(2)}</span>
                    <span className={`${styles.change} ${stockData.change >= 0 ? styles.positive : styles.negative}`}>
                        {stockData.change > 0 ? '+' : ''}{stockData.change} ({stockData.changePercent}%)
                    </span>
                </div>
            </header>

            <div className={styles.grid}>
                <Card title="Key Metrics" className={styles.card}>
                    <div className={styles.metricRow}>
                        <span>Volatility</span>
                        <span>{stockData.metrics.volatility}</span>
                    </div>
                    <div className={styles.metricRow}>
                        <span>Trend</span>
                        <span>{stockData.metrics.trend}</span>
                    </div>
                    <div className={styles.metricRow}>
                        <span>Beta</span>
                        <span>{stockData.metrics.beta}</span>
                    </div>
                    <div className={styles.metricRow}>
                        <span>Optionlysis</span>
                        <span>{stockData.metrics.optionlysis}</span>
                    </div>
                    <div className={styles.metricRow}>
                        <span>Avg Swing</span>
                        <span>{stockData.metrics.swing}</span>
                    </div>
                </Card>

                <Card title="10-Day History" className={styles.card}>
                    <div className={styles.metricRow}>
                        <span>10-Day High</span>
                        <span>${stockData.historical.high10.toFixed(2)}</span>
                    </div>
                    <div className={styles.metricRow}>
                        <span>10-Day Low</span>
                        <span>${stockData.historical.low10.toFixed(2)}</span>
                    </div>
                    <div className={styles.metricRow}>
                        <span>10-Day Change</span>
                        <span className={stockData.historical.change10 >= 0 ? styles.positive : styles.negative}>
                            {stockData.historical.change10}%
                        </span>
                    </div>
                </Card>
            </div>

            <Card title="Chart Placeholder" className={styles.chartCard}>
                <div className={styles.chartPlaceholder}>
                    Chart for {ticker} would go here
                </div>
            </Card>
        </div>
    );
}
