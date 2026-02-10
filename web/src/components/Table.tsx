import React from 'react';
import styles from './Table.module.css';

interface Column {
    header: string;
    accessor: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
    columns: Column[];
    data: any[];
    minWidth?: string;
    loading?: boolean;
    emptyState?: React.ReactNode;
}

function Table({ columns, data, minWidth = '600px', loading = false, emptyState }: TableProps) {
    if (loading) {
        return (
            <div className={styles.tableContainer}>
                <table className={styles.table} style={{ minWidth }}>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.accessor} className={styles.th}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <tr key={i} className={styles.tr}>
                                {columns.map((col) => (
                                    <td key={col.accessor} className={styles.td}>
                                        <div className="h-4 bg-gray-800/50 rounded animate-pulse w-3/4"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table} style={{ minWidth }}>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.accessor} className={styles.th}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 && emptyState ? (
                        <tr>
                            <td colSpan={columns.length} className={styles.td}>
                                {emptyState}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={rowIndex} className={styles.tr}>
                                {columns.map((col) => (
                                    <td key={`${rowIndex}-${col.accessor}`} className={styles.td}>
                                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// Memoize the table to prevent re-renders unless data/columns change
export default React.memo(Table);
