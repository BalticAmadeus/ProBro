import * as React from 'react';
import { useState, useMemo } from 'react';
import { CommandAction, IndexRow } from '../model';
import DataGrid from 'react-data-grid';
import type { SortColumn } from 'react-data-grid';
import * as columnName from './column.json';
import { Logger } from '../../../common/Logger';
import { getVSCodeAPI, getVSCodeConfiguration } from '@utils/vscode';

type Comparator = (a: IndexRow, b: IndexRow) => number;
function getComparator(sortColumn: string): Comparator {
    switch (sortColumn) {
        case 'cName':
        case 'cFlags':
        case 'cFields':
            return (a, b) => {
                return a[sortColumn].localeCompare(b[sortColumn]);
            };
        default:
            throw new Error(`unsupported sortColumn: "${sortColumn}"`);
    }
}

function rowKeyGetter(row: IndexRow) {
    return row.cName;
}

function Indexes() {
    const [rows, setRows] = useState<IndexRow[]>([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
        () => new Set()
    );
    const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
    const vscode = getVSCodeAPI();
    const configuration = getVSCodeConfiguration();
    const logger = new Logger(configuration.logging.react);

    const windowRezise = () => {
        setWindowHeight(window.innerHeight);
    };

    window.addEventListener(
        'contextmenu',
        (e) => {
            e.stopImmediatePropagation();
        },
        true
    );

    React.useEffect(() => {
        window.addEventListener('resize', windowRezise);

        return () => {
            window.removeEventListener('resize', windowRezise);
        };
    }, []);

    const sortedRows = useMemo((): readonly IndexRow[] => {
        if (sortColumns.length === 0) {
            return rows;
        }

        return [...rows].sort((a, b) => {
            for (const sort of sortColumns) {
                const comparator = getComparator(sort.columnKey);
                const compResult = comparator(a, b);
                if (compResult !== 0) {
                    return sort.direction === 'ASC' ? compResult : -compResult;
                }
            }
            return 0;
        });
    }, [rows, sortColumns]);

    React.useLayoutEffect(() => {
        window.addEventListener('message', (event) => {
            const message = event.data;
            logger.log('indexes explorer data', message);
            switch (message.command) {
                case 'data':
                    setRows(message.data.indexes);
                    setDataLoaded(true);
            }
        });
    });

    const refresh = () => {
        const obj = {
            id: '2',
            action: CommandAction.RefreshTableData,
        };
        logger.log('Refresh Table Data', obj);
        vscode.postMessage(obj);
    };

    return (
        <div>
            {!dataLoaded ? (
                <button className='refreshButton' onClick={refresh}>
                    Refresh
                </button>
            ) : rows.length > 0 ? (
                <DataGrid
                    columns={columnName.columns}
                    rows={sortedRows}
                    defaultColumnOptions={{
                        sortable: true,
                        resizable: true,
                    }}
                    selectedRows={selectedRows}
                    onSelectedRowsChange={setSelectedRows}
                    rowKeyGetter={rowKeyGetter}
                    onRowsChange={setRows}
                    sortColumns={sortColumns}
                    onSortColumnsChange={setSortColumns}
                    style={{ height: windowHeight }}
                />
            ) : null}
        </div>
    );
}

export default Indexes;
