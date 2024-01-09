import {
    CSSProperties,
    Fragment,
    MouseEvent,
    UIEvent,
    useEffect,
    useRef,
    useState,
} from 'react';

import DataGrid, { SortColumn, SelectColumn, CopyEvent } from 'react-data-grid';

import { IOETableData } from '@src/db/Oe';
import { CommandAction, ICommand, ProcessAction } from '../model';
import ExportData from './Export';
import UpdatePopup from './Update';
import { ProBroButton } from '@assets/button';
import RawOnTwoToneIcon from '@mui/icons-material/RawOnTwoTone';
import RawOffTwoToneIcon from '@mui/icons-material/RawOffTwoTone';
import PlayArrowTwoToneIcon from '@mui/icons-material/PlayArrowTwoTone';
import { Logger } from '@src/common/Logger';
import { ISettings } from '@src/common/IExtensionSettings';
import { getOEFormatLength } from '@utils/oe/format/oeFormat';
import { OEDataTypePrimitive } from '@utils/oe/oeDataTypeEnum';

const filterCSS: CSSProperties = {
    inlineSize: '100%',
    padding: '4px',
    fontSize: '14px',
};

interface IConfigProps {
    vscode: any;
    tableData: IOETableData;
    tableName: string;
    configuration: ISettings;
    isReadOnly: boolean;
}

interface IErrorObject {
    error: string;
    description: string;
    trace?: string;
}
interface IStatisticsObject {
    recordsRetrieved: number;
    recordsRetrievalTime: number;
    connectTime: number;
}

function QueryForm({
    vscode,
    tableData,
    tableName,
    configuration,
    isReadOnly,
    ...props
}: IConfigProps) {
    const [wherePhrase, setWherePhrase] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [isFormatted, setIsFormatted] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isDataRetrieved, setIsDataRetrieved] = useState(false);
    const [errorObject, setErrorObject] = useState<IErrorObject>();
    const [statisticsObject, setStatisticsObject] =
        useState<IStatisticsObject>();

    const [rawRows, setRawRows] = useState(() => tableData.data);
    const [formattedRows, setFormattedRows] = useState(() => tableData.data);
    const [columns, setColumns] = useState(() => tableData.columns);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [columnsCRUD, setColumnsCRUD] = useState(() => []);
    const [recordsCRUD, setRecordsCRUD] = useState(() => []);
    const [loaded, setLoaded] = useState(() => 0);
    const [rowID, setRowID] = useState('');
    const [scrollHeight, setScrollHeight] = useState(() => 0);
    const [isWindowSmall, setIsWindowSmall] = useState(false);

    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const [sortAction, setSortAction] = useState(false);
    const [initialDataLoad, setInitialDataLoad] = useState(true);
    const [recordColor, setRecordColor] = useState('red');
    const logger = new Logger(configuration.logging.react);

    window.addEventListener(
        'contextmenu',
        (e) => {
            e.stopImmediatePropagation();
        },
        true
    );

    const [filters, _setFilters] = useState({
        columns: {},
        enabled: true,
    });
    const filtersRef = useRef(filters);
    const setFilters = (data) => {
        filtersRef.current = data;
        _setFilters(data);
    };

    const [selectedRows, setSelectedRows] = useState(
        (): ReadonlySet<string> => new Set()
    );

    const getDataFormat = () => {
        setIsFormatted(!isFormatted);
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
            setIsWindowSmall(window.innerWidth <= 828); // Adjust the breakpoint value as needed
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
                    setIsError(true);
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
                    setIsError(true);
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
                    setIsError(true);
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

                                    var timer;
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
                    setIsError(false);
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

    const onQueryClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        prepareQuery();
    };

    let input = document.getElementById('input');

    const handleKeyDown = (e) => {
        let selected = document.querySelector('.selected') as HTMLLIElement;
        if (e.key === 'Enter' && selected === null) {
            e.preventDefault();
            prepareQuery();
        }

        if (e.key === 'Enter' && selected !== null) {
            e.preventDefault();
            const selectedText =
                document.querySelector('.selected').textContent;

            addText(input, selectedText);
            createListener(document.getElementById('input'), selectedColumns);
        }

        if (e.keyCode === 38) {
            if (selected === null) {
                document
                    .querySelectorAll('.autocomplete-list li')
                    .item(0)
                    .classList.add('selected');
            } else {
                document
                    .querySelectorAll('.autocomplete-list li')
                    .forEach(function (item) {
                        item.classList.remove('selected');
                    });
                if (selected.previousElementSibling === null) {
                    selected.parentElement.lastElementChild.classList.add(
                        'selected'
                    );
                } else {
                    selected.previousElementSibling.classList.add('selected');
                }
            }
            selected = document.querySelector('.selected');
            selected.scrollIntoView();
            selected.focus();
        }

        if (e.keyCode === 40) {
            if (selected === null) {
                document
                    .querySelectorAll('.autocomplete-list li')
                    .item(0)
                    .classList.add('selected');
            } else {
                document
                    .querySelectorAll('.autocomplete-list li')
                    .forEach(function (item) {
                        item.classList.remove('selected');
                    });

                if (selected.nextElementSibling === null) {
                    selected.parentElement.firstElementChild.classList.add(
                        'selected'
                    );
                } else {
                    selected.nextElementSibling.classList.add('selected');
                }
            }
            selected = document.querySelector('.selected');
            selected.scrollIntoView();
            selected.focus();
        }
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
                    ? 'green'
                    : 'red'
            );
        } else {
            setSortAction(false);
        }
    }

    function getLoaded() {
        if (recordColor === 'red') {
            return '> ' + loaded;
        } else {
            return loaded;
        }
    }

    function getFooterTag() {
        if (isError) {
            return (
                <div style={{ color: 'red' }}>
                    <pre>{`Error: ${errorObject.error}
Description: ${errorObject.description}`}</pre>
                </div>
            );
        } else if (isDataRetrieved) {
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                    }}
                >
                    <pre style={{ marginRight: 'auto' }}>
                        {'Records in grid:'}
                        <span style={{ color: recordColor }}>
                            {getLoaded()}
                        </span>
                    </pre>
                    {isWindowSmall ? null : (
                        <pre style={{ marginLeft: 'auto' }}>
                            {`Recent records numbers: ${statisticsObject.recordsRetrieved}`}
                        </pre>
                    )}
                    <pre
                        style={{ marginLeft: 'auto' }}
                    >{`Recent retrieval time: ${statisticsObject.recordsRetrievalTime}`}</pre>
                </div>
            );
        } else {
            return <></>;
        }
    }

    function rowKeyGetter(row: any) {
        return row.ROWID;
    }

    // CRUD operations
    const [open, setOpen] = useState(false);
    const [action, setAction] = useState<ProcessAction>();
    const [readRow, setReadRow] = useState([]);

    const readRecord = (row: string[]) => {
        setAction(ProcessAction.Read);
        setReadRow(row);
        setOpen(true);
    };

    const insertRecord = () => {
        processRecord(ProcessAction.Insert);
    };
    const updateRecord = () => {
        processRecord(ProcessAction.Update);
    };
    const deleteRecord = () => {
        processRecord(ProcessAction.Delete);
    };
    const copyRecord = () => {
        processRecord(ProcessAction.Copy);
    };

    const processRecord = (mode: ProcessAction) => {
        setAction(mode);
        const rowids: string[] = [];
        selectedRows.forEach((element) => {
            rowids.push(element);
        });

        const command: ICommand = {
            id: 'CRUD',
            action: CommandAction.CRUD,
            params: {
                start: 0,
                pageLength: selectedRows.size,
                timeOut: 1000,
                minTime: 1000,
                lastRowID: selectedRows.values().next().value,
                crud: rowids,
                mode: ProcessAction[mode],
            },
        };
        logger.log('crud data request', command);
        vscode.postMessage(command);
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

    const suggestions = document.querySelector('#column-list');

    function autocomplete(input, list) {
        let lastWord = input.value.split(' ').pop();

        suggestions.innerHTML = '';

        for (const item of list) {
            if (
                item.toUpperCase().includes(lastWord.toUpperCase()) ||
                lastWord === null
            ) {
                const suggestion = document.createElement('li');
                suggestion.innerHTML = item;
                suggestion.style.cursor = 'pointer';
                suggestions.appendChild(suggestion);
            }
        }
    }

    function addText(input, newText) {
        let wordArray = input.value.split(' ');
        wordArray.pop();
        input.value = '';
        for (const word of wordArray) {
            input.value += word;
            input.value += ' ';
        }
        input.value += newText;
        input.value += ' ';
        setWherePhrase(input.value);
    }

    function mouseoverListener() {
        document
            .querySelectorAll('.autocomplete-list li')
            .forEach(function (item) {
                item.addEventListener('mouseover', function () {
                    document
                        .querySelectorAll('.autocomplete-list li')
                        .forEach(function (item) {
                            item.classList.remove('selected');
                        });
                    this.classList.add('selected');
                });
                item.addEventListener('click', function () {
                    addText(input, this.innerHTML);
                    document.getElementById('input').focus();
                    setTimeout(() => {
                        createListener(
                            document.getElementById('input'),
                            selectedColumns
                        );
                    }, 301);
                });
            });
    }

    function createListener(input, list) {
        input.addEventListener('input', autocomplete(input, list));
        mouseoverListener();
    }

    function hideSuggestions() {
        setTimeout(() => {
            suggestions.innerHTML = '';
        }, 300);
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
            <div className='container'>
                <div className='title'>Query</div>
                <div className='content'>
                    <form className='form' action='#'>
                        <div className='connection-details'>
                            <div className='input-box'>
                                <input
                                    id='input'
                                    className='textInputQuery'
                                    type='text'
                                    placeholder='WHERE ...'
                                    value={wherePhrase}
                                    onFocus={() => {
                                        createListener(
                                            document.getElementById('input'),
                                            selectedColumns
                                        );
                                    }}
                                    onBlur={hideSuggestions}
                                    onChange={(event) => {
                                        createListener(
                                            document.getElementById('input'),
                                            selectedColumns
                                        );
                                        setWherePhrase(event.target.value);
                                    }}
                                    onKeyDown={handleKeyDown}
                                />
                                {isWindowSmall ? (
                                    <ProBroButton
                                        ref={(input) => (inputQuery = input)}
                                        startIcon={<PlayArrowTwoToneIcon />}
                                        onClick={onQueryClick}
                                    />
                                ) : (
                                    <ProBroButton
                                        ref={(input) => (inputQuery = input)}
                                        startIcon={<PlayArrowTwoToneIcon />}
                                        onClick={onQueryClick}
                                    >
                                        Query
                                    </ProBroButton>
                                )}
                            </div>
                        </div>
                        <ul className='autocomplete-list' id='column-list'></ul>
                    </form>
                    <div className='query-options'>
                        <ExportData
                            wherePhrase={wherePhrase}
                            vscode={vscode}
                            sortColumns={sortColumns}
                            filters={filters}
                            selectedRows={selectedRows}
                            logValue={configuration.logging.react}
                        />
                        <ProBroButton
                            onClick={getDataFormat}
                            startIcon={
                                isFormatted ? (
                                    <RawOffTwoToneIcon />
                                ) : (
                                    <RawOnTwoToneIcon />
                                )
                            }
                        >
                            {' '}
                        </ProBroButton>
                    </div>
                    <div className='query-options'>
                        <UpdatePopup
                            vscode={vscode}
                            selectedRows={selectedRows}
                            columns={columnsCRUD}
                            rows={recordsCRUD}
                            tableName={tableName}
                            open={open}
                            setOpen={setOpen}
                            action={action}
                            insertRecord={insertRecord}
                            updateRecord={updateRecord}
                            deleteRecord={deleteRecord}
                            copyRecord={copyRecord}
                            readRow={readRow}
                            logValue={configuration.logging.react}
                            defaultTrigger={!!configuration.useWriteTriggers} // !! fixes missing setting issue
                            isReadOnly={isReadOnly}
                        ></UpdatePopup>
                    </div>
                </div>
            </div>
            <div>
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
            </div>
            <div className='footer'>{getFooterTag()}</div>
            {isLoading && <div>Loading more rows...</div>}
        </Fragment>
    );
}

export default QueryForm;
