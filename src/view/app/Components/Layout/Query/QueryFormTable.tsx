import { CSSProperties, UIEvent, useMemo } from 'react';
import DataGrid, {
    CopyEvent,
    DataGridHandle,
    SortColumn,
    SortDirection,
} from 'react-data-grid';
import { Box } from '@mui/material';
import { IFilters } from '@app/common/types';

interface QueryFormTableProps {
    queryGridRef: React.RefObject<DataGridHandle>;
    selected: any[];
    rows: any[];
    sortColumns: SortColumn[];
    handleScroll: (event: UIEvent<HTMLDivElement>) => void;
    onSortClick: (inputSortColumns: SortColumn[]) => void;
    filters: IFilters;
    selectedRows: Set<string>;
    setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
    rowKeyGetter: (row: any) => string;
    readRecord: (row: any) => void;
    handleCopy: (event: CopyEvent<any>) => void;
    windowHeight: number;
    setRowHeight: () => number;
    reloadData: (loaded: number) => void;
    configuration: any;
    setFilters: (data: IFilters) => void;
}

interface ColumnHeaderRendererProps {
    column: {
        key: string;
        name: string;
    };
    sortDirection?: SortDirection;
    priority?: string;
    onSort: (shiftKey: boolean) => void;
    isCellSelected?: boolean;
    reloadData: (loaded: number) => void;
    configuration: any;
    filters: IFilters;
    setFilters: (data: IFilters) => void;
}

const getColumnHeaderRenderer: React.FC<ColumnHeaderRendererProps> = ({
    column,
    sortDirection,
    priority,
    onSort,
    isCellSelected,
    reloadData,
    configuration,
    filters,
    setFilters,
}) => {
    const filterCSS: CSSProperties = {
        inlineSize: '100%',
        padding: '4px',
        fontSize: '14px',
    };

    function handleKeyDown(event) {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            onSort(event.ctrlKey || event.metaKey);
        }
    }

    function handleClick(event) {
        onSort(event.ctrlKey || event.metaKey);
    }

    let timer;
    function handleKeyInputTimeout() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            reloadData(configuration.initialBatchSizeLoad);
        }, 500);
    }

    function testKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            reloadData(configuration.initialBatchSizeLoad);
        }
    }

    function handleInputKeyDown(event) {
        const tempFilters = filters;
        tempFilters.columns[column.key] = event.target.value;
        setFilters(tempFilters);
        if (configuration.filterAsYouType === true) {
            handleKeyInputTimeout();
        }
    }
    return (
        <div>
            <div className={filters.enabled ? 'filter-cell' : undefined}>
                <span
                    tabIndex={-1}
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                    }}
                    className='rdg-header-sort-cell'
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                >
                    <span
                        className='rdg-header-sort-name'
                        style={{
                            flexGrow: '1',
                            overflow: 'clip',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {column.name}
                    </span>
                    <span>
                        <svg
                            viewBox='0 0 12 8'
                            width='12'
                            height='8'
                            className='rdg-sort-arrow'
                            style={{
                                fill: 'currentcolor',
                            }}
                        >
                            {sortDirection === 'ASC' && (
                                <path d='M0 8 6 0 12 8'></path>
                            )}
                            {sortDirection === 'DESC' && (
                                <path d='M0 0 6 8 12 0'></path>
                            )}
                        </svg>
                        {priority}
                    </span>
                </span>
            </div>
            {filters.enabled && (
                <div className={'filter-cell'}>
                    <input
                        className='textInput'
                        autoFocus={!!isCellSelected}
                        style={filterCSS}
                        defaultValue={filters.columns[column.key]}
                        onChange={handleInputKeyDown}
                        onKeyDown={testKeyDown}
                    />
                </div>
            )}
        </div>
    );
};

const QueryFormTable: React.FC<QueryFormTableProps> = ({
    queryGridRef,
    selected,
    rows,
    sortColumns,
    handleScroll,
    onSortClick,
    filters,
    selectedRows,
    setSelectedRows,
    rowKeyGetter,
    readRecord,
    handleCopy,
    windowHeight,
    setRowHeight,
    reloadData,
    configuration,
    setFilters,
}) => {
    const adjustedColumns = useMemo(
        () =>
            selected.map((col) => ({
                ...col,
                headerRenderer: (props) =>
                    getColumnHeaderRenderer({
                        ...props,
                        reloadData,
                        configuration,
                        filters,
                        setFilters,
                    }),
            })),
        [selected]
    );

    const getCellHeight = () => {
        if (configuration.gridTextSize === 'Large') {
            return 40;
        } else if (configuration.gridTextSize === 'Medium') {
            return 30;
        } else if (configuration.gridTextSize === 'Small') {
            return 20;
        }
        return 30;
    };

    const calculateHeight = () => {
        const rowCount = rows.length;
        const cellHeight = getCellHeight();
        const startingHeight = 85;
        const calculatedHeight = startingHeight + rowCount * cellHeight;
        return calculatedHeight;
    };

    return (
        <Box>
            <DataGrid
                ref={queryGridRef}
                columns={adjustedColumns}
                rows={rows}
                defaultColumnOptions={{
                    sortable: true,
                    resizable: true,
                }}
                sortColumns={sortColumns}
                onScroll={handleScroll}
                onSortColumnsChange={onSortClick}
                className={filters.enabled ? 'filter-cell' : ''}
                headerRowHeight={filters.enabled ? 70 : undefined}
                style={{
                    height: calculateHeight(),
                    overflow: 'auto',
                    minHeight: 105,
                    maxHeight: windowHeight - 120,
                    whiteSpace: 'pre',
                }}
                selectedRows={selectedRows}
                onSelectedRowsChange={setSelectedRows}
                rowKeyGetter={rowKeyGetter}
                onRowDoubleClick={readRecord}
                onCopy={handleCopy}
                rowHeight={setRowHeight}
            ></DataGrid>
        </Box>
    );
};

export default QueryFormTable;
