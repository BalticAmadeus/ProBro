import * as React from "react";
import { createRoot } from "react-dom/client";

import "./query.css";
import { IOETableData } from "../../db/oe";

import DataGrid, { SortColumn } from "react-data-grid";
import { CommandAction, ICommand, IConfig } from "./model";
import { v1 } from "uuid";
import ExportData from "./export";
import { prependListener } from "cluster";

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

interface IConfigState {
    tableData: IOETableData;
}

const vscode = window.acquireVsCodeApi();

function QueryForm({ vscode, tableData, ...props }: IConfigProps) {
    const oldState = vscode.getState();
    const initState = oldState ? oldState : { tableData: tableData };
    //    const [vsState, setVsState] = React.useState(initState as IConfigState);
    const [wherePhrase, setWherePhrase] = React.useState<string>("");
    const [isLoading, setIsLoading] = React.useState(false);

    const [isFormatted, setIsFormatted] = React.useState(false);
    const [rawRows, setRawRows] = React.useState(() => tableData.data);
    const [formattedRows, setFormattedRows] = React.useState(() => tableData.data);
    const [columns, setColumns] = React.useState(() => tableData.columns);
    const [loaded, setLoaded] = React.useState(() => 0);
    const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

    const [sortColumns, setSortColumns] = React.useState<readonly SortColumn[]>(
        []
    );
    
    const getDataFormat = () => {
        setIsFormatted(!isFormatted);
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
                    if (message.data.columns.length !== columns.length) {
                        setColumns([]);
                        message.data.columns.forEach((column) => {
                            switch (column.type) {
                                case "integer":
                                case "decimal":
                                case "int64":
                                    column.cellClass = "rightAlign";
                                    column.headerCellClass = "rightAlign";
                                    break;
                                default:
                                    break;   
                            } 
                            setColumns(message.data.columns);
                        });
                    }
                    const boolField = message.data.columns.filter((field) => field.type === "logical");
                    if(boolField.length !== 0) {
                        message.data.rawData.forEach(row => {
                            boolField.forEach(field => {
                                row[field.name] = row[field.name].toString();
                            });
                        });
                    }
                    setRawRows([...rawRows, ...message.data.rawData]);
                    setLoaded(loaded + message.data.rawData.length);
                    setFormattedRows([...formattedRows, ...message.data.formattedData]);
                    setLoaded(loaded + message.data.formattedData.length);

                    break;
            }
            setIsLoading(false);
        });
    });

    const onQueryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (isLoading) {return;};
        setIsLoading(true);
        setLoaded(0);
        setRawRows([]);
        setFormattedRows([]);
        makeQuery(0, 1000, sortColumns);
    };

    function makeQuery(loaded, pageLength, sortColumns) {
        const command: ICommand = {
            id: v1(),
            action: CommandAction.Query,
            params: {
                where: wherePhrase,
                start: loaded,
                pageLength: pageLength,
                sortColumns: sortColumns,
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
        if (isLoading || !isAtBottom(event)) {return;};
        setIsLoading(true);
        makeQuery(loaded, 100, sortColumns);
    }

    function onSortClick(inputSortColumns: SortColumn[]) {
        if (isLoading) {return;};
        setSortColumns(inputSortColumns);
        setLoaded(0);
        setRawRows([]);
        setFormattedRows([]);
        makeQuery(0, loaded, inputSortColumns);
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
                    <div className="query-options">
                        <ExportData 
                        wherePhrase={wherePhrase}
                        vscode={vscode}
                        /> 
                        <input
                            type="button"
                            value={isFormatted.toString()}
                            onClick={getDataFormat}
                        ></input>
                    </div>                  

                </div>
            </div>
            <DataGrid
                columns={columns}
                rows={isFormatted ? formattedRows : rawRows}
                onScroll={handleScroll}
                defaultColumnOptions={{
                    sortable: true,
                    resizable: true,
                }}
                sortColumns={sortColumns}
                onSortColumnsChange={onSortClick}
                style={{ height: windowHeight - 75, whiteSpace: "pre"}}
            ></DataGrid>
            {isLoading && <div>Loading more rows...</div>}
        </React.Fragment>
    );
}

const root = createRoot(document.getElementById("root"));
root.render(<QueryForm vscode={vscode} tableData={window.tableData} />);
