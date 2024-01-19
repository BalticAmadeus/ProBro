import {
    CSSProperties,
    Fragment,
    UIEvent,
    useEffect,
    useRef,
    useState,
} from 'react';

import DataGrid, { SortColumn, SelectColumn, CopyEvent } from 'react-data-grid';

import { IOETableData } from '@src/db/Oe';
import { CommandAction, ICommand, ProcessAction } from '../model';
import { Logger } from '@src/common/Logger';
import { getOEFormatLength } from '@utils/oe/format/oeFormat';
import { OEDataTypePrimitive } from '@utils/oe/oeDataTypeEnum';
import { IErrorObject, emptyErrorObj } from '@utils/error';
import QueryFormFooter from '@app/Components/Layout/Query/QueryFormFooter';
import { Box } from '@mui/material';
import QueryFormHead from '@app/Components/Layout/Query/QueryFormHead';
import { IFilters } from '@app/common/types';
import { getVSCodeAPI, getVSCodeConfiguration } from '@utils/vscode';
import { green, red } from '@mui/material/colors';

const filterCSS: CSSProperties = {
    inlineSize: '100%',
    padding: '4px',
    fontSize: '14px',
};

interface IConfigProps {
    tableData: IOETableData;
    tableName: string;
    isReadOnly: boolean;
}

interface IStatisticsObject {
    recordsRetrieved: number;
    recordsRetrievalTime: number;
    connectTime: number;
}

function QueryForm({
    tableData,
    tableName,
    isReadOnly,
    ...props
}: IConfigProps) {
    const [wherePhrase, setWherePhrase] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [isFormatted, setIsFormatted] = useState(false);
    const [isDataRetrieved, setIsDataRetrieved] = useState(false);
    const [errorObject, setErrorObject] = useState<IErrorObject>(emptyErrorObj);
    const [statisticsObject, setStatisticsObject] = useState<IStatisticsObject>(
        { recordsRetrieved: 0, recordsRetrievalTime: 0, connectTime: 0 }
    );

    const [rawRows, setRawRows] = useState(() => tableData.data);
    const [formattedRows, setFormattedRows] = useState(() => tableData.data);
    const [columns, setColumns] = useState(() => tableData.columns);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [columnsCRUD, setColumnsCRUD] = useState(() => []);
    const [rowsCRUD, setRecordsCRUD] = useState(() => []);
    const [loaded, setLoaded] = useState(() => 0);
    const [rowID, setRowID] = useState('');
    const [scrollHeight, setScrollHeight] = useState(() => 0);
    const [isWindowSmall, setIsWindowSmall] = useState(false);

    const [sortColumns, setSortColumns] = useState<SortColumn[]>([]);
    const [sortAction, setSortAction] = useState(false);
    const [initialDataLoad, setInitialDataLoad] = useState(true);
    const [recordColor, setRecordColor] = useState('red');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    const configuration = getVSCodeConfiguration();
    const logger = new Logger(configuration.logging.react);
    const vscode = getVSCodeAPI();

    window.addEventListener(
        'contextmenu',
        (e) => {
            e.stopImmediatePropagation();
        },
        true
    );

    const [filters, _setFilters] = useState<IFilters>({
        columns: {},
        enabled: true,
    });
    const filtersRef = useRef(filters);
    const setFilters = (data) => {
        filtersRef.current = data;
        _setFilters(data);
    };

    const windowResize = () => {
        setWindowHeight(window.innerHeight);
    };

    let inputQuery: HTMLButtonElement = undefined;
    useEffect(() => {
        if (inputQuery) {
            inputQuery.click();
        }
    }, []);

    useEffect(() => {
        window.addEventListener('resize', windowResize);

        return () => {
            window.removeEventListener('resize', windowResize);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsWindowSmall(window.innerWidth <= 920); // Adjust the breakpoint value as needed
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const messageEvent = (event) => {
        const message = event.data;
        logger.log('got query data', message);
        switch (message.command) {
        case 'columns':
            setSelectedColumns([...message.columns]);
            break;
        case 'submit':
            if (message.data.error) {
                // should be displayed in UpdatePopup window
                setErrorObject({
                    error: message.data.error,
                    description: message.data.description,
                    trace: message.data.trace,
                });
                setIsDataRetrieved(false);
            } else {
                setSelectedRows(new Set());
                setOpen(false);
                reloadData(
                    loaded + (action === ProcessAction.Insert ? 1 : 0)
                );
            }
            break;
        case 'crud':
            if (message.data.error) {
                setErrorObject({
                    error: message.data.error,
                    description: message.data.description,
                    trace: message.data.trace,
                });
                setIsDataRetrieved(false);
            } else {
                setColumnsCRUD(message.data.columns);
                setRecordsCRUD(message.data.rawData);
                setOpen(true);
            }
            break;
        case 'data':
            if (message.data.error) {
                setErrorObject({
                    error: message.data.error,
                    description: message.data.description,
                    trace: message.data.trace,
                });
                setIsDataRetrieved(false);
            } else {
                if (message.data.columns.length !== columns.length) {
                    const fontSize = +window
                        .getComputedStyle(
                            document.getElementsByClassName(
                                'rdg-header-row'
                            )[0]
                        )
                        .getPropertyValue('font-size')
                        .match(/\d+[.]?\d+/);
                    message.data.columns.forEach((column) => {
                        if (column.key !== OEDataTypePrimitive.Rowid) {
                            column.headerRenderer = function ({
                                column,
                                sortDirection,
                                priority,
                                onSort,
                                isCellSelected,
                            }) {
                                function handleKeyDown(event) {
                                    if (
                                        event.key === ' ' ||
                                            event.key === 'Enter'
                                    ) {
                                        event.preventDefault();
                                        onSort(
                                            event.ctrlKey || event.metaKey
                                        );
                                    }
                                }

                                function handleClick(event) {
                                    onSort(event.ctrlKey || event.metaKey);
                                }

                                let timer;
                                function handleKeyInputTimeout() {
                                    clearTimeout(timer);
                                    timer = setTimeout(() => {
                                        reloadData(
                                            configuration.initialBatchSizeLoad
                                        );
                                    }, 500);
                                }
                                function testKeyDown(event) {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        reloadData(
                                            configuration.initialBatchSizeLoad
                                        );
                                    }
                                }

                                function handleInputKeyDown(event) {
                                    const tempFilters = filters;
                                    tempFilters.columns[column.key] =
                                            event.target.value;
                                    setFilters(tempFilters);
                                    if (
                                        configuration.filterAsYouType ===
                                            true
                                    ) {
                                        handleKeyInputTimeout();
                                    }
                                }

                                return (
                                    <Fragment>
                                        <div
                                            className={
                                                filters.enabled
                                                    ? 'filter-cell'
                                                    : undefined
                                            }
                                        >
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
                                                        textOverflow:
                                                                'ellipsis',
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
                                                        {sortDirection ===
                                                                'ASC' && (
                                                            <path d='M0 8 6 0 12 8'></path>
                                                        )}
                                                        {sortDirection ===
                                                                'DESC' && (
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
                                                    autoFocus={
                                                        isCellSelected
                                                    }
                                                    style={filterCSS}
                                                    defaultValue={
                                                        filters.columns[
                                                            column.key
                                                        ]
                                                    }
                                                    onChange={
                                                        handleInputKeyDown
                                                    }
                                                    onKeyDown={testKeyDown}
                                                />
                                            </div>
                                        )}
                                    </Fragment>
                                );
                            };
                        }
                        column.minWidth = column.name.length * fontSize;
                        column.width =
                                getOEFormatLength(column.format ?? '') *
                                (fontSize - 4);
                        switch (column.type.toUpperCase()) {
                        case OEDataTypePrimitive.Integer:
                        case OEDataTypePrimitive.Decimal:
                        case OEDataTypePrimitive.Int64:
                            column.cellClass = 'rightAlign';
                            column.headerCellClass = 'rightAlign';
                            break;
                        default:
                            break;
                        }
                    });
                    setColumns([SelectColumn, ...message.data.columns]);
                    if (message.columns !== undefined) {
                        setSelectedColumns([...message.columns]);
                    } else {
                        setSelectedColumns(
                            [
                                ...message.data.columns.map(
                                    (column) => column.name
                                ),
                            ].filter(
                                (column) =>
                                    column !== OEDataTypePrimitive.Rowid
                            )
                        );
                    }
                }
                const boolField = message.data.columns.filter(
                    (field) => field.type === OEDataTypePrimitive.Logical
                );
                if (boolField.length !== 0) {
                    message.data.rawData.forEach((row) => {
                        boolField.forEach((field) => {
                            if (row[field.name] !== null) {
                                row[field.name] =
                                        row[field.name].toString();
                            }
                        });
                    });
                }
                setRawRows([...rawRows, ...message.data.rawData]);
                setRowID(
                    message.data.rawData.length > 0
                        ? message.data.rawData[
                            message.data.rawData.length - 1
                        ].ROWID
                        : rowID
                );
                setLoaded(loaded + message.data.rawData.length);
                setFormattedRows([
                    ...formattedRows,
                    ...message.data.formattedData,
                ]);
                setLoaded(loaded + message.data.formattedData.length);
                setErrorObject(emptyErrorObj);
                setIsDataRetrieved(true);
                setStatisticsObject({
                    recordsRetrieved: message.data.debug.recordsRetrieved,
                    recordsRetrievalTime:
                            message.data.debug.recordsRetrievalTime,
                    connectTime: message.data.debug.timeConnect,
                });
                allRecordsRetrieved(
                    message.data.debug.recordsRetrieved,
                    message.data.debug.recordsRetrievalTime
                );
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        window.addEventListener('message', messageEvent);
        return () => {
            window.removeEventListener('message', messageEvent);
        };
    });

    const prepareQuery = () => {
        if (isLoading) {
            return;
        }
        setIsLoading(true);
        setLoaded(0);
        setRawRows([]);
        setFormattedRows([]);
        setInitialDataLoad(true);
        makeQuery(
            0,
            configuration.initialBatchSizeLoad /*number of records for first load*/,
            '',
            sortColumns,
            filters,
            configuration.batchMaxTimeout /*ms for data retrieval*/,
            configuration.batchMinTimeout
        );
    };

    function reloadData(loaded: number) {
        setLoaded(0);
        setRawRows([]);
        setFormattedRows([]);
        makeQuery(0, loaded, '', sortColumns, filters, 0, 0);
    }

    function makeQuery(
        loaded,
        pageLength,
        lastRowID,
        sortColumns,
        inputFilters,
        timeOut,
        minTime
    ) {
        const command: ICommand = {
            id: 'Query',
            action: CommandAction.Query,
            params: {
                wherePhrase: wherePhrase,
                start: loaded,
                pageLength: pageLength,
                lastRowID: lastRowID,
                sortColumns: sortColumns,
                filters: inputFilters,
                timeOut: timeOut,
                minTime: minTime,
            },
        };
        logger.log('make query', command);
        vscode.postMessage(command);
    }

    function isAtBottom({ currentTarget }: UIEvent<HTMLDivElement>): boolean {
        return (
            currentTarget.scrollTop + 10 >=
            currentTarget.scrollHeight - currentTarget.clientHeight
        );
    }

    function isHorizontalScroll({
        currentTarget,
    }: UIEvent<HTMLDivElement>): boolean {
        return currentTarget.scrollTop === scrollHeight;
    }

    async function handleScroll(event: UIEvent<HTMLDivElement>) {
        if (isLoading || !isAtBottom(event) || isHorizontalScroll(event)) {
            return;
        }
        setScrollHeight(event.currentTarget.scrollTop);
        setIsLoading(true);
        makeQuery(
            loaded,
            configuration.batchSize,
            rowID,
            sortColumns,
            filters,
            configuration.batchMaxTimeout,
            configuration.batchMinTimeout
        );
    }

    function onSortClick(inputSortColumns: SortColumn[]) {
        if (isLoading) {
            return;
        }
        setSortAction(true);
        setSortColumns(inputSortColumns);
        setLoaded(0);
        setRawRows([]);
        setFormattedRows([]);
        makeQuery(0, loaded, '', inputSortColumns, filters, 0, 0);
    }

    function allRecordsRetrieved(
        recentRecords: number,
        recentRetrievalTime: number
    ) {
        if (!sortAction) {
            const currentBatchSize: number = initialDataLoad
                ? configuration.initialBatchSizeLoad
                : configuration.batchSize;
            setInitialDataLoad(false);
            setRecordColor(
                recentRecords < currentBatchSize &&
                    recentRetrievalTime < configuration.batchMaxTimeout
                    ? green[500]
                    : red[500]
            );
        } else {
            setSortAction(false);
        }
    }

    function rowKeyGetter(row: any) {
        return row.ROWID;
    }

    // CRUD operations
    const [open, setOpen] = useState(false);
    const [action, setAction] = useState<ProcessAction>();
    const [readRow, setReadRow] = useState<string[]>([]);

    const readRecord = (row: string[]) => {
        setAction(ProcessAction.Read);
        setReadRow(row);
        setOpen(true);
    };

    function filterColumns() {
        if (selectedColumns.length !== 0) {
            const selection = columns.filter((column) => {
                let testColumn = column.key;
                if (/\[\d+\]$/.test(column.key)) {
                    testColumn = column.key.match(/[^[]+/)[0];
                }
                return (
                    selectedColumns.includes(testColumn) ||
                    testColumn === 'select-row'
                );
            });
            return selection;
        } else {
            return [];
        }
    }
    const selected = filterColumns();

    function handleCopy({ sourceRow, sourceColumnKey }: CopyEvent<any>): void {
        if (window.isSecureContext) {
            navigator.clipboard.writeText(sourceRow[sourceColumnKey]);
        }
    }

    const calculateHeight = () => {
        const rowCount = isFormatted ? formattedRows.length : rawRows.length;
        let minHeight;
        if (configuration.gridTextSize === 'Large') {
            minHeight = 40;
        } else if (configuration.gridTextSize === 'Medium') {
            minHeight = 30;
        } else if (configuration.gridTextSize === 'Small') {
            minHeight = 20;
        }
        const startingHeight = 85;
        const calculatedHeight = startingHeight + rowCount * minHeight;
        return calculatedHeight;
    };

    const setRowHeight = () => {
        let height = 0;

        if (configuration.gridTextSize === 'Large') {
            height = 40;
        } else if (configuration.gridTextSize === 'Medium') {
            height = 30;
        } else if (configuration.gridTextSize === 'Small') {
            height = 20;
        }

        return height;
    };

    return (
        <Fragment>
            <QueryFormHead
                wherePhrase={wherePhrase}
                setWherePhrase={setWherePhrase}
                suggestions={selectedColumns}
                isWindowSmall={isWindowSmall}
                onEnter={prepareQuery}
                onButtonClick={(event) => {
                    event.preventDefault();
                    prepareQuery();
                }}
                onLoad={prepareQuery}
                sortColumns={sortColumns}
                filters={filters}
                selectedRows={selectedRows}
                formatButtonOnClick={() => {
                    setIsFormatted(!isFormatted);
                }}
                isFormatted={isFormatted}
                tableName={tableName}
                columns={columnsCRUD}
                rows={rowsCRUD}
                open={open}
                setOpen={setOpen}
                action={action}
                setAction={setAction}
                readRow={readRow}
                isReadOnly={isReadOnly}
            />
            <Box>
                <DataGrid
                    columns={selected}
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
            <QueryFormFooter
                errorObj={errorObject}
                totalRecords={loaded}
                newRecords={statisticsObject.recordsRetrieved}
                retrievalTime={statisticsObject.recordsRetrievalTime}
                showRecentNumbers={isWindowSmall}
                recordColor={recordColor}
                show={isDataRetrieved}
            />
            {isLoading && <div>Loading more rows...</div>}
        </Fragment>
    );
}

export default QueryForm;
