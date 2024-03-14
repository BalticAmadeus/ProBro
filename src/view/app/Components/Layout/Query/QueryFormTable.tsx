import { CSSProperties, Fragment, UIEvent } from 'react';
import DataGrid, {
    CopyEvent,
    DataGridHandle,
    SortColumn,
} from 'react-data-grid';
import { Box } from '@mui/material';
import { IFilters } from '@app/common/types';

const filterCSS: CSSProperties = {
    inlineSize: '100%',
    padding: '4px',
    fontSize: '14px',
};

interface QueryFormTableProps {
    queryGridRef: React.RefObject<DataGridHandle>;
    selected: any[];
    isFormatted: boolean;
    formattedRows: any[];
    rawRows: any[];
    sortColumns: SortColumn[];
    handleScroll: (event: UIEvent<HTMLDivElement>) => void;
    onSortClick: (inputSortColumns: SortColumn[]) => void;
    filters: IFilters;
    selectedRows: Set<string>;
    setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
    rowKeyGetter: (row: any) => string;
    readRecord: (row: any) => void;
    handleCopy: (event: CopyEvent<any>) => void;
    calculateHeight: () => number;
    windowHeight: number;
    setRowHeight: () => number;
    reloadData: (loaded: number) => void;
    configuration: any;
    setFilters: (data: IFilters) => void;
}

const headerRenderer = ({
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
        <Fragment>
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
                        autoFocus={isCellSelected}
                        style={filterCSS}
                        defaultValue={filters.columns[column.key]}
                        onChange={handleInputKeyDown}
                        onKeyDown={testKeyDown}
                    />
                </div>
            )}
        </Fragment>
    );
};

const QueryFormTable: React.FC<QueryFormTableProps> = ({
    queryGridRef,
    selected,
    isFormatted,
    formattedRows,
    rawRows,
    sortColumns,
    handleScroll,
    onSortClick,
    filters,
    selectedRows,
    setSelectedRows,
    rowKeyGetter,
    readRecord,
    handleCopy,
    calculateHeight,
    windowHeight,
    setRowHeight,
    reloadData,
    configuration,
    setFilters,
}) => {
    const adjustedColumns = selected.map((col) => ({
        ...col,
        headerRenderer: (props) =>
            headerRenderer({
                ...props,
                reloadData,
                configuration,
                filters,
                setFilters,
            }),
    }));
    return (
        <Box>
            <DataGrid
                ref={queryGridRef}
                columns={adjustedColumns}
                rows={isFormatted ? formattedRows : rawRows}
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
