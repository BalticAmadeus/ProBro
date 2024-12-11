import { Fragment, UIEvent, useEffect, useRef, useState } from 'react';

import {
    SortColumn,
    SelectColumn,
    CopyEvent,
    DataGridHandle,
} from 'react-data-grid';

import { IOETableData } from '@src/db/Oe';
import { CommandAction, ICommand, ProcessAction } from '../model';
import { Logger } from '@src/common/Logger';
import { getOEFormatLength } from '@utils/oe/format/oeFormat';
import { OEDataTypePrimitive } from '@utils/oe/oeDataTypeEnum';
import { IErrorObject, emptyErrorObj } from '@utils/error';
import QueryFormFooter from '@app/Components/Layout/Query/QueryFormFooter';
import QueryFormHead from '@app/Components/Layout/Query/QueryFormHead';
import { IFilters } from '@app/common/types';
import { getVSCodeAPI, getVSCodeConfiguration } from '@utils/vscode';
import { green, red } from '@mui/material/colors';
import { HighlightFieldsCommand } from '@src/common/commands/fieldsCommands';
import QueryFormTable from '@app/Components/Layout/Query/QueryFormTable';

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

function QueryForm({ tableData, tableName, isReadOnly }: IConfigProps) {
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
    const queryGridRef = useRef<DataGridHandle>(null);

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

    const inputQuery: HTMLButtonElement = undefined;
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

    const highlightColumn = (column: string) => {
        // + 1 because columns start from index 1. Rows start from index 0.
        const columnIdx: number = selectedColumns.indexOf(column) + 1;

        if (!columnIdx || columnIdx < 0) {
            return;
        }

        const cellHeight = getCellHeight();
        const rowIdx = Math.floor(scrollHeight / cellHeight);

        // scrollToColumn doesn't work, so a workaround is to use selectCell and rowIdx
        queryGridRef.current?.selectCell({ idx: columnIdx, rowIdx: rowIdx });
    };

    const processBooleanFields = (columns: any[], rawData: any[]) => {
        const boolField = columns.filter(
            (field) => field.type.toUpperCase() === OEDataTypePrimitive.Logical
        );
        if (boolField.length !== 0) {
            rawData.forEach((row) => {
                boolField.forEach((field) => {
                    if (row[field.name] !== null) {
                        row[field.name] = row[field.name].toString();
                    }
                });
            });
        }
    };

    const handleSubmit = (message: any) => {
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
            reloadData(loaded + (action === ProcessAction.Insert || action === ProcessAction.Copy ? 1 : 0));
        }
    };

    const handleCrud = (message: any) => {
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
    };

    const handleData = (message: any) => {
        if (message.data.error) {
            setErrorObject({
                error: message.data.error,
                description: message.data.description,
                trace: message.data.trace,
            });
            setIsDataRetrieved(false);
            return;

        } else if (message.data.columns.length !== columns.length) {
            const fontSize = +window
                .getComputedStyle(
                    document.getElementsByClassName('rdg-header-row')[0]
                )
                .getPropertyValue('font-size')
                .match(/\d+[.]?\d+/);
            message.data.columns.forEach((column) => {
                column.minWidth = column.name.length * fontSize;
                column.width =
                    getOEFormatLength(column.format ?? '') * (fontSize - 4);
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
            if (message.columns.length !== 0 && message.columns !== undefined) {
                setSelectedColumns([...message.columns]);
            } else {
                setSelectedColumns([
                    ...message.data.columns.map((column) => column.name),
                ]);
            }
        }
        processBooleanFields(message.data.columns, message.data.rawData);

        setRawRows([...rawRows, ...message.data.rawData]);
        setRowID(
            message.data.rawData.length > 0
                ? message.data.rawData[message.data.rawData.length - 1].ROWID
                : rowID
        );
        setLoaded(loaded + message.data.rawData.length);
        setFormattedRows([...formattedRows, ...message.data.formattedData]);
        setLoaded(loaded + message.data.formattedData.length);
        setErrorObject(emptyErrorObj);
        setIsDataRetrieved(true);
        setStatisticsObject({
            recordsRetrieved: message.data.debug.recordsRetrieved,
            recordsRetrievalTime: message.data.debug.recordsRetrievalTime,
            connectTime: message.data.debug.timeConnect,
        });
        allRecordsRetrieved(
            message.data.debug.recordsRetrieved,
            message.data.debug.recordsRetrievalTime
        );
    };

    const handleCustomViewParams = (message: any) => {
        const params = message.params;

        if (!params) {
            return;
        }
        try {
            setWherePhrase(params.wherePhrase);
            setFilters(params.filters);
            setSortColumns(params.sortColumns);
        } catch (error) {
            console.error('setting params', error);
        }
    };

    const messageEvent = (event) => {
        const message = event.data;
        logger.log('got query data', message);
        switch (message.command) {
            case 'highlightColumn':
                highlightColumn((message as HighlightFieldsCommand).column);
                break;
            case 'columns':
                setSelectedColumns([...message.columns]);
                break;
            case 'refetch':
                prepareQuery();
                break;
            case 'submit':
                handleSubmit(message);
                break;
            case 'crud':
                handleCrud(message);
                break;
            case 'data':
                handleData(message);
                break;
            case 'customViewParams':
                handleCustomViewParams(message);
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

    function handleSaveClick(name: string) {
        const command: ICommand = {
            id: 'saveCustomView',
            action: CommandAction.SaveCustomQuery,
            customView: {
                name,
                wherePhrase,
                sortColumns,
                filters,
                useDeleteTriggers: configuration.useDeleteTriggers,
                useWriteTriggers: configuration.useWriteTriggers,
            },
        };
        vscode.postMessage(command);
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
        if (!isLoading) {
            setIsLoading(true);
        }
        logger.log('make query', command);
        vscode.postMessage(command);
    }

    const isAtBottom = ({
        currentTarget,
    }: UIEvent<HTMLDivElement>): boolean => {
        return (
            currentTarget.scrollTop + 10 >=
            currentTarget.scrollHeight - currentTarget.clientHeight
        );
    };

    const isHorizontalScroll = ({
        currentTarget,
    }: UIEvent<HTMLDivElement>): boolean => {
        return currentTarget.scrollTop === scrollHeight;
    };

    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
        setScrollHeight(event.currentTarget.scrollTop);
        if (isLoading || !isAtBottom(event) || isHorizontalScroll(event)) {
            return;
        }
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
    };

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

    const readRecord = (row) => {
        const selectedRowsSet = new Set<string>();
        selectedRowsSet.add(row.ROWID);
        setSelectedRows(selectedRowsSet);
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
                handleSaveClick={(preferenceName) =>
                    handleSaveClick(preferenceName)
                }
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
                setIsFormatted={setIsFormatted}
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
            {selectedColumns.length === 0 &&
            <p style={{ textAlign: 'center', marginTop: '0px' }}>
                No Fields are selected from the tab "Fields Explorer"...
            </p>
            }
            <QueryFormTable
                queryGridRef={queryGridRef}
                selected={selected}
                rows={isFormatted ? formattedRows : rawRows}
                sortColumns={sortColumns}
                handleScroll={handleScroll}
                onSortClick={onSortClick}
                filters={filters}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                rowKeyGetter={rowKeyGetter}
                readRecord={readRecord}
                handleCopy={handleCopy}
                windowHeight={windowHeight}
                setRowHeight={setRowHeight}
                reloadData={reloadData}
                configuration={configuration}
                setFilters={setFilters}
            />
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
