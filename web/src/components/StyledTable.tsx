import React from 'react';
import styles from './StyledTable.module.css';

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
}

function StyledTable({ columns, data, minWidth = '100%', loading = false }: TableProps) {
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
                        {[...Array(10)].map((_, i) => (
                            <tr key={i} className={styles.tr}>
                                {columns.map((col) => (
                                    <td key={col.accessor} className={styles.td}>
                                        <div className="h-4 bg-gray-100 rounded animate-pulse w-full"></div>
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
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className={styles.tr}>
                            {columns.map((col) => (
                                <td key={`${rowIndex}-${col.accessor}`} className={styles.td}>
                                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default React.memo(StyledTable);
