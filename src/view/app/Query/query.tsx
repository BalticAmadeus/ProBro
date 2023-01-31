import * as React from "react";
import { IOETableData } from "../../../db/oe";
import DataGrid, { SortColumn, SelectColumn, CopyEvent } from "react-data-grid";

import { CommandAction, ICommand, ProcessAction } from "../model";
import ExportData from "./Export";
import UpdatePopup from "./Update";
import { ProBroButton } from "./Components/button";
import RawOnTwoToneIcon from "@mui/icons-material/RawOnTwoTone";
import RawOffTwoToneIcon from "@mui/icons-material/RawOffTwoTone";
import PlayArrowTwoToneIcon from "@mui/icons-material/PlayArrowTwoTone";

const filterCSS: React.CSSProperties = {
  inlineSize: "100%",
  padding: "4px",
  fontSize: "14px",
};

interface IConfigProps {
  vscode: any;
  tableData: IOETableData;
  tableName: string;
  configuration: any;
}

interface IErrorObject {
  error: String;
  description: String;
  trace?: String;
}
interface IStatisticsObject {
  recordsRetrieved: number;
  recordsRetrievalTime: number;
  connectTime: number;
}

function QueryForm({ vscode, tableData, tableName, configuration, ...props }: IConfigProps) {
    const [wherePhrase, setWherePhrase] = React.useState<string>("");
    const [isLoading, setIsLoading] = React.useState(false);

    const [isFormatted, setIsFormatted] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const [isDataRetrieved, setIsDataRetrieved] = React.useState(false);
    const [errorObject, setErrorObject] = React.useState<IErrorObject>();
    const [statisticsObject, setStatisticsObject] =
        React.useState<IStatisticsObject>();

    const [rawRows, setRawRows] = React.useState(() => tableData.data);
    const [formattedRows, setFormattedRows] = React.useState(
        () => tableData.data
    );
    const [columns, setColumns] = React.useState(() => tableData.columns);
    const [selectedColumns, setSelectedColumns] = React.useState([]);
    const [columnsCRUD, setColumnsCRUD] = React.useState(() => []);
    const [recordsCRUD, setRecordsCRUD] = React.useState(() => []);
    const [loaded, setLoaded] = React.useState(() => 0);
    const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
    const [rowID, setRowID] = React.useState("");
    const [scrollHeight, setScrollHeight] = React.useState(() => 0);

    const [sortColumns, setSortColumns] = React.useState<readonly SortColumn[]>(
        []
    );

    window.addEventListener('contextmenu', e => {
      e.stopImmediatePropagation();
  }, true);

    const [filters, _setFilters] = React.useState({
        columns: {},
        enabled: true,
    });
    const filtersRef = React.useRef(filters);
    const setFilters = (data) => {
        filtersRef.current = data;
        _setFilters(data);
    };

    const [selectedRows, setSelectedRows] = React.useState(
        (): ReadonlySet<string> => new Set()
    );
    
    const getDataFormat = () => {
      setIsFormatted(!isFormatted);
    };

    const windowResize = () => {
      setWindowHeight(window.innerHeight);
    };

    var inputQuery: HTMLButtonElement = undefined;
    React.useEffect(() => {
     if (inputQuery) {
       inputQuery.click();
       }    
    }, []);

  React.useEffect(() => {
    window.addEventListener("resize", windowResize);

    return () => {
      window.removeEventListener("resize", windowResize);
    };
  }, []);

  const messageEvent = (event) => {
    const message = event.data;
    switch (message.command) {
      case "columns":
        setSelectedColumns([...message.columns]);
        break;
      case "submit":
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
          reloadData(loaded + (action === ProcessAction.Insert ? 1 : 0));
        }
        break;
      case "crud":
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
      case "data":
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
                document.getElementsByClassName("rdg-header-row")[0]
              )
              .getPropertyValue("font-size")
              .match(/\d+[.]?\d+/);
            message.data.columns.forEach((column) => {
              if (column.key !== "ROWID") {
                column.headerRenderer = function ({
                  column,
                  sortDirection,
                  priority,
                  onSort,
                  isCellSelected,
                }) {
                  function handleKeyDown(event) {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      onSort(event.ctrlKey || event.metaKey);
                    }
                  }

                  function handleClick(event) {
                    onSort(event.ctrlKey || event.metaKey);
                  }

                  var timer;
                  function handleKeyInputTimeout() {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                      reloadData(configuration.initialBatchSizeLoad);
                    }, 500);
                  }

                  function handleInputKeyDown(event) {
                    var tempFilters = filters;
                    tempFilters.columns[column.key] = event.target.value;
                    setFilters(tempFilters);
                    handleKeyInputTimeout();
                  }

                  return (
                    <React.Fragment>
                      <div
                        className={filters.enabled ? "filter-cell" : undefined}
                      >
                        <span
                          tabIndex={-1}
                          style={{
                            cursor: "pointer",
                            display: "flex",
                          }}
                          className="rdg-header-sort-cell"
                          onClick={handleClick}
                          onKeyDown={handleKeyDown}
                        >
                          <span
                            className="rdg-header-sort-name"
                            style={{
                              flexGrow: "1",
                              overflow: "clip",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {column.name}
                          </span>
                          <span>
                            <svg
                              viewBox="0 0 12 8"
                              width="12"
                              height="8"
                              className="rdg-sort-arrow"
                              style={{
                                fill: "currentcolor",
                              }}
                            >
                              {sortDirection === "ASC" && (
                                <path d="M0 8 6 0 12 8"></path>
                              )}
                              {sortDirection === "DESC" && (
                                <path d="M0 0 6 8 12 0"></path>
                              )}
                            </svg>
                            {priority}
                          </span>
                        </span>
                      </div>
                      {filters.enabled && (
                        <div className={"filter-cell"}>
                          <input
                            className="textInput"
                            autoFocus={isCellSelected}
                            style={filterCSS}
                            defaultValue={filters.columns[column.key]}
                            onChange={handleInputKeyDown}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                };
              }
              column.minWidth = column.name.length * (fontSize);
              switch (column.type) {
                case "integer":
                case "decimal":
                case "int64":
                  column.cellClass = "rightAlign";
                  column.headerCellClass = "rightAlign";
                  column.width = column.format.length * (fontSize - 3);
                  break;
                case "character":
                  let dataLength = column.format.length;
                  if (/x\(\d+\)/.test(column.format)) {
                    dataLength = +column.format.match(/\d+/);
                  }
                  column.width = dataLength * (fontSize - 3);
                  break;
                case "date":
                case "datetime":
                case "datetime-tz":
                  column.width = column.format.length * (fontSize - 3);
                  break;
                case "logical":
                  column.width = column.name.length * (fontSize - 3);
                  break;
                default:
                  break;
              }
            });
            setColumns([SelectColumn, ...message.data.columns]);
            if (message.columns !== undefined) {
              setSelectedColumns([...message.columns]); 
          } else {
              setSelectedColumns([...message.data.columns.map(column => column.name)].filter(column => column !== "ROWID"));
          }
          }
          const boolField = message.data.columns.filter(
            (field) => field.type === "logical"
          );
          if (boolField.length !== 0) {
            message.data.rawData.forEach((row) => {
              boolField.forEach((field) => {
                if( row[field.name] !== null ) {
                  row[field.name] = row[field.name].toString();
                }
              });
            });
          }
          setRawRows([...rawRows, ...message.data.rawData]);
          setRowID(
            message.data.rawData.length > 0
              ? message.data.rawData[message.data.rawData.length - 1].ROWID
              : rowID
          );
          setLoaded(loaded + message.data.rawData.length);
          setFormattedRows([...formattedRows, ...message.data.formattedData]);
          setLoaded(loaded + message.data.formattedData.length);
          setIsError(false);
          setIsDataRetrieved(true);
          setStatisticsObject({
            recordsRetrieved: message.data.debug.recordsRetrieved,
            recordsRetrievalTime: message.data.debug.recordsRetrievalTime,
            connectTime: message.data.debug.timeConnect,
          });
        }
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    window.addEventListener("message", messageEvent);
    return () => {
      window.removeEventListener("message", messageEvent);
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
    makeQuery(
      0,
      configuration.initialBatchSizeLoad /*number of records for first load*/,
      "",
      sortColumns,
      filters,
      configuration.batchMaxTimeout /*ms for data retrieval*/
    );
  };

  const onQueryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    prepareQuery();
  };

  const handleKeyDown = (event) => {
    if(event.key === "Enter") {
      event.preventDefault();
      prepareQuery();
    }
  };

  function reloadData(loaded: number) {
    setLoaded(0);
    setRawRows([]);
    setFormattedRows([]);
    makeQuery(0, loaded, "", sortColumns, filters, 0);
  }

  function makeQuery(
    loaded,
    pageLength,
    lastRowID,
    sortColumns,
    inputFilters,
    timeOut
  ) {
    const command: ICommand = {
      id: "Query",
      action: CommandAction.Query,
      params: {
        wherePhrase: wherePhrase,
        start: loaded,
        pageLength: pageLength,
        lastRowID: lastRowID,
        sortColumns: sortColumns,
        filters: inputFilters,
        timeOut: timeOut,
      },
    };
    vscode.postMessage(command);
  }

  function isAtBottom({
    currentTarget,
  }: React.UIEvent<HTMLDivElement>): boolean {
    return (
      currentTarget.scrollTop + 10 >=
      currentTarget.scrollHeight - currentTarget.clientHeight
    );
  }

  function isHorizontalScroll({
    currentTarget,
  }: React.UIEvent<HTMLDivElement>): boolean {
    return currentTarget.scrollTop === scrollHeight;
  }

  async function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    if (isLoading || !isAtBottom(event) || isHorizontalScroll(event)) {
      return;
    }
    setScrollHeight(event.currentTarget.scrollTop);
    setIsLoading(true);
    makeQuery(loaded, configuration.batchSize, rowID, sortColumns, filters, configuration.batchMaxTimeout);
  }

  function onSortClick(inputSortColumns: SortColumn[]) {
    if (isLoading) {
      return;
    }
    setSortColumns(inputSortColumns);
    setLoaded(0);
    setRawRows([]);
    setFormattedRows([]);
    makeQuery(0, loaded, "", inputSortColumns, filters, 0);
  }

  function getFooterTag() {
    if (isError) {
      return (
        <div style={{ color: "red" }}>
          <pre>{`Error: ${errorObject.error}
Description: ${errorObject.description}`}</pre>
        </div>
      );
    } else if (isDataRetrieved) {
      return (
        <div>
          <pre>{`Records in grid: ${loaded}
Recent records numbers: ${statisticsObject.recordsRetrieved}
Recent retrieval time: ${statisticsObject.recordsRetrievalTime}`}</pre>
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
  const [open, setOpen] = React.useState(false);
  const [action, setAction] = React.useState<ProcessAction>();
  const [readRow, setReadRow] = React.useState([]);

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
  const processRecord = (mode: ProcessAction) => {
    setAction(mode);
    const rowids: string[] = [];
    selectedRows.forEach((element) => {
      rowids.push(element);
    });

    const command: ICommand = {
      id: "CRUD",
      action: CommandAction.CRUD,
      params: {
        start: 0,
        pageLength: selectedRows.size,
        timeOut: 1000,
        lastRowID: selectedRows.values().next().value,
        crud: rowids,
        mode: ProcessAction[mode],
      },
    };
    vscode.postMessage(command);
  }; 
  
   function filterColumns() {
        if (selectedColumns.length !== 0) {
          const selection = columns.filter((column) => {
            let testColumn = column.key;
            if (/\[\d+\]$/.test(column.key)) {
              testColumn = column.key.match(/[^[]+/)[0];
            }
            return selectedColumns.includes(testColumn) || testColumn === "select-row";
          });
          return selection;
        } else {
            return [];
        }
    };
    const selected = filterColumns();

    function handleCopy({ sourceRow, sourceColumnKey }: CopyEvent<any>): void {
      if (window.isSecureContext) {
        navigator.clipboard.writeText(sourceRow[sourceColumnKey]);
      }
    }
    
    return (
        <React.Fragment>
            <div className="container">
                <div className="title">Query</div>
                <div className="content">
                    <form className="form" action="#">
                        <div className="connection-details">
                            <div className="input-box">
                                <input
                                    className="textInput"
                                    type="text"
                                    placeholder="WHERE ..."
                                    value={wherePhrase}
                                    style={{ width: "370px" }}
                                    onChange={(event) => {
                                        setWherePhrase(event.target.value);
                                    }}
                                    onKeyDown={handleKeyDown}
                                />
                                <ProBroButton
                                    ref={(input) => (inputQuery = input)}
                                    startIcon={<PlayArrowTwoToneIcon />}
                                    onClick={onQueryClick}
                                >Query</ProBroButton>
                            </div>
                        </div>
                    </form>
                    <div className="query-options">
                        <ExportData
                            wherePhrase={wherePhrase}
                            vscode={vscode}
                            sortColumns={sortColumns}
                            filters={filters}
                            selectedRows={selectedRows}
                        />
                        <ProBroButton
                            onClick={getDataFormat}
                            startIcon={isFormatted ? <RawOffTwoToneIcon /> : <RawOnTwoToneIcon /> }
                        > </ProBroButton>
                    </div>
                    <div className="query-options">
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
                            readRow={readRow}
                        ></UpdatePopup>
                    </div>
                </div>
            </div>
            <DataGrid
                columns={selected}
                rows={isFormatted ? formattedRows : rawRows}
                onScroll={handleScroll}
                defaultColumnOptions={{
                    sortable: true,
                    resizable: true,
                }}
                sortColumns={sortColumns}
                onSortColumnsChange={onSortClick}
                className={filters.enabled ? "filter-cell" : undefined}
                headerRowHeight={filters.enabled ? 70 : undefined}
                style={{ height: windowHeight - 175, whiteSpace: "pre" }}
                selectedRows={selectedRows}
                onSelectedRowsChange={setSelectedRows}
                rowKeyGetter={rowKeyGetter}
                onRowDoubleClick={readRecord}
                onCopy={handleCopy}
            ></DataGrid>
            {getFooterTag()}
            {isLoading && <div>Loading more rows...</div>}
        </React.Fragment>
    );
}

export default QueryForm;
