import { IFilters } from '@app/common/types';
import ColumnHeaderCell from '@app/Components/Layout/Query/ColumnHeaderCell';
import { Box } from '@mui/material';
import { UIEvent, useEffect, useState } from 'react';
import DataGrid, {
    CopyEvent,
    DataGridHandle,
    SortColumn,
} from 'react-data-grid';

interface QueryFormTableProps {
    queryGridRef: React.RefObject<DataGridHandle>;
    selected: any[];
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
    configuration: any;
    rows: any[];
    reloadData: (loaded: number) => void;
    setFilters: (data: IFilters) => void;
}

const QueryFormTable: React.FC<QueryFormTableProps> = ({
    queryGridRef,
    selected,
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
    configuration,
    rows,
    reloadData,
    setFilters,
}) => {
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

    const handleOutsideClick = (event: MouseEvent) => {
        const grid = queryGridRef.current?.element?.contains(
            event.target as Node
        );
        if (!grid) {
            setSelectedColumn(null);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    const adjustedColumns = selected.map((column, index) => {
        if (index === 0) {
            return column;
        }

        return {
            ...column,
            headerRenderer: function (props) {
                return (
                    <ColumnHeaderCell
                        column={props.column}
                        sortDirection={props.sortDirection}
                        priority={props.priority}
                        onSort={props.onSort}
                        filters={filters}
                        isCellSelected={selectedColumn === props.column.key}
                        setCellSelected={() =>
                            setSelectedColumn(props.column.key)
                        }
                        setFilters={setFilters}
                        configuration={configuration}
                        reloadData={reloadData}
                    />
                );
            },
        };
    });
    const calculateHeight = () => {
        const rowCount = rows.length;
        const cellHeight = getCellHeight();
        const startingHeight = 85;
        const calculatedHeight = startingHeight + rowCount * cellHeight;
        return calculatedHeight;
    };

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
