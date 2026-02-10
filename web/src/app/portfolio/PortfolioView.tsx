import React from 'react';
import Table from '@/components/Table';
import Card from '@/components/Card';
import styles from '@/app/page.module.css';
import { getPortfolio } from '@/lib/portfolio';

const columns = [
    { header: 'Ticker', accessor: 'ticker' },
    { header: 'Shares', accessor: 'shares', render: (val: number) => val.toLocaleString() },
    { header: 'Bought Price', accessor: 'boughtPrice', render: (val: number) => `$${val.toFixed(2)}` },
    { header: 'Current Price', accessor: 'currentPrice', render: (val: number) => `$${val.toFixed(2)}` },
    {
        header: 'Current Value',
        accessor: 'currentValue',
        render: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
        header: 'P/L',
        accessor: 'profitLoss',
        render: (val: number) => (
            <span style={{ color: val >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {val >= 0 ? '+' : ''}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        )
    },
    {
        header: 'P/L %',
        accessor: 'profitLossPercent',
        render: (val: number) => (
            <span style={{ color: val >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {val >= 0 ? '+' : ''}{val.toFixed(2)}%
            </span>
        )
    },
];

export default async function PortfolioView() {
    // Fetch once
    const portfolio = await getPortfolio();

    // Calculate totals explicitly to avoid re-fetching
    const totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
    const totalPL = portfolio.reduce((sum, item) => sum + item.profitLoss, 0);

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <Card title="Total Value">
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </Card>
                <Card title="Total P/L">
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: totalPL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                    }}>
                        {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </Card>
            </div>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Holdings</h2>
                <Table columns={columns} data={portfolio} />
            </section>
        </>
    );
}
