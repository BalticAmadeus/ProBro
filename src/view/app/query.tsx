import * as React from "react";
import { createRoot } from "react-dom/client";

import "./query.css";
import { IOETableData } from "../../db/oe";

import DataGrid, { SortColumn } from "react-data-grid";

import { CommandAction, ICommand } from "./model";
import { v1 } from "uuid";
import ExportData from "./export";

const filterCSS: React.CSSProperties = {
    inlineSize: "100%",
    padding: "4px",
    fontSize: "14px",
};

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        tableData: IOETableData;
    }
}

interface IConfigProps {
    vscode: any;
    tableData: IOETableData;
}

const vscode = window.acquireVsCodeApi();

function QueryForm({ vscode, tableData, ...props }: IConfigProps) {
    //    const oldState = vscode.getState();
    //    const initState = oldState ? oldState : { tableData: tableData };
    //    const [vsState, setVsState] = React.useState(initState as IConfigState);
    const [wherePhrase, setWherePhrase] = React.useState<string>("");
    const [isLoading, setIsLoading] = React.useState(false);

    const [rows, setRows] = React.useState(() => tableData.data);
    const [columns, setColumns] = React.useState(() => tableData.columns);

    const [loaded, setLoaded] = React.useState(() => 0);
    const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

    const [sortColumns, setSortColumns] = React.useState<readonly SortColumn[]>(
        []
    );

    const [filters, _setFilters] = React.useState({
        columns: {},
        enabled: true,
    });
    const filtersRef = React.useRef(filters);
    const setFilters = (data) => {
        filtersRef.current = data;
        _setFilters(data);
    };

    const windowRezise = () => {
        setWindowHeight(window.innerHeight);
    };

    React.useEffect(() => {
        window.addEventListener("resize", windowRezise);

        return () => {
            window.removeEventListener("resize", windowRezise);
        };
    }, []);

    React.useEffect(() => {
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.command) {
                case "data":
                    if (message.data.columns.length != columns.length) {
                        message.data.columns.forEach((item) => {
                            item.filterValue = "";
                            item.headerRenderer = function ({
                                column,
                                sortDirection,
                                priority,
                                onSort,
                                isCellSelected,
                            }) {
                                function handleKeyDown(event) {
                                    if (
                                        event.key === " " ||
                                        event.key === "Enter"
                                    ) {
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
                                    timer = setTimeout(reloadData, 500);
                                }

                                function reloadData() {
                                    setLoaded(0);
                                    setRows([]);
                                    makeQuery(0, loaded, sortColumns, filters);
                                }

                                function handleInputKeyDown(event) {
                                    var tempFilters = filters;
                                    tempFilters.columns[column.key] =
                                        event.target.value;
                                    setFilters(tempFilters);
                                    handleKeyInputTimeout();
                                }

                                return (
                                    <React.Fragment>
                                        <div
                                            className={
                                                filters.enabled
                                                    ? "filter-cell"
                                                    : undefined
                                            }
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
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {item.name}
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
                                                        {sortDirection ==
                                                            "ASC" && (
                                                            <path d="M0 8 6 0 12 8"></path>
                                                        )}
                                                        {sortDirection ==
                                                            "DESC" && (
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
                                                    autoFocus={isCellSelected}
                                                    style={filterCSS}
                                                    defaultValue={
                                                        filters.columns[
                                                            column.key
                                                        ]
                                                    }
                                                    onChange={
                                                        handleInputKeyDown
                                                    }
                                                />
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            };
                        });
                        setColumns(
                            message.data.columns.sort(
                                (a, b) => a.order - b.order
                            )
                        );
                    }
                    setRows([...rows, ...message.data.data]);
                    setLoaded(loaded + message.data.data.length);
            }
            setIsLoading(false);
        });
    });

    const onQueryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        setLoaded(0);
        setRows([]);
        makeQuery(0, 1000, sortColumns, filters);
    };

    function makeQuery(loaded, pageLength, sortColumns, inputFilters) {
        const command: ICommand = {
            id: v1(),
            action: CommandAction.Query,
            params: {
                where: wherePhrase,
                start: loaded,
                pageLength: pageLength,
                sortColumns: sortColumns,
                filters: inputFilters,
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

    async function handleScroll(event: React.UIEvent<HTMLDivElement>) {
        if (isLoading || !isAtBottom(event)) return;
        setIsLoading(true);
        makeQuery(loaded, 100, sortColumns, filters);
    }

    function onSortClick(inputSortColumns: SortColumn[]) {
        if (isLoading) return;
        setSortColumns(inputSortColumns);
        setLoaded(0);
        setRows([]);
        makeQuery(0, loaded, inputSortColumns, filters);
    }

    return (
        <React.Fragment>
            <div className="container">
                <div className="title">Query</div>
                <div className="content">
                    <form action="#">
                        <div className="connection-details">
                            <div className="input-box">
                                <input
                                    type="text"
                                    placeholder="WHERE ..."
                                    value={wherePhrase}
                                    style={{ width: "370px" }}
                                    onChange={(event) => {
                                        setWherePhrase(event.target.value);
                                    }}
                                />
                                <input
                                    type="submit"
                                    value="Query"
                                    onClick={onQueryClick}
                                ></input>
                            </div>
                        </div>
                    </form>
                    <ExportData wherePhrase={wherePhrase} vscode={vscode} />
                </div>
            </div>
            <DataGrid
                columns={columns}
                rows={rows}
                onScroll={handleScroll}
                defaultColumnOptions={{
                    sortable: true,
                    resizable: true,
                }}
                sortColumns={sortColumns}
                onSortColumnsChange={onSortClick}
                style={{ height: windowHeight - 75 }}
                className={filters.enabled ? "filter-cell" : undefined}
                headerRowHeight={filters.enabled ? 70 : undefined}
            ></DataGrid>
            {isLoading && <div>Loading more rows...</div>}
        </React.Fragment>
    );
}

const root = createRoot(document.getElementById("root"));
root.render(<QueryForm vscode={vscode} tableData={window.tableData} />);
