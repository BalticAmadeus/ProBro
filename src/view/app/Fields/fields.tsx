import * as React from "react";
import { useState, useMemo } from "react";

import { FieldRow, CommandAction, ICommand } from "../model";
import DataGrid, { SelectColumn }from "react-data-grid";
import type { SortColumn } from "react-data-grid";

import * as columnName from "./column.json";

type Comparator = (a: FieldRow, b: FieldRow) => number;
function getComparator(sortColumn: string): Comparator {
    switch (sortColumn) {
        case "order":
        case "extent":
        case "decimals":
        case "rpos":
            return (a, b) => {
                return a[sortColumn] - b[sortColumn];
            };
        case "name":
        case "type":
        case "format":
        case "label":
        case "initial":
        case "columnLabel":
        case "mandatory":
        case "valexp":
        case "valMessage":
        case "helpMsg":
        case "description":
        case "viewAs":
            return (a, b) => {
                return a[sortColumn].localeCompare(b[sortColumn]);
            };
        default:
            throw new Error(`unsupported sortColumn: "${sortColumn}"`);
    }
}

function rowKeyGetter(row: FieldRow) {
    return row.order;
}

function Fields({ initialData, vscode }) {
    const [rows, setRows] = useState(initialData.fields as FieldRow[]);
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const [selectedRows, setSelectedRows] = useState<ReadonlySet<number>>();
    const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

    const windowRezise = () => {
        setWindowHeight(window.innerHeight);
    };

    React.useEffect(() => {
        window.addEventListener("resize", windowRezise);

        return () => {
            window.removeEventListener("resize", windowRezise);
        };
    }, []);

    const sortedRows = useMemo((): readonly FieldRow[] => {
        if (sortColumns.length === 0) {
            return rows;
        }

        return [...rows].sort((a, b) => {
            for (const sort of sortColumns) {
                const comparator = getComparator(sort.columnKey);
                const compResult = comparator(a, b);
                if (compResult !== 0) {
                    return sort.direction === "ASC" ? compResult : -compResult;
                }
            }
            return 0;
        });
    }, [rows, sortColumns]);

    React.useEffect(() => {
        // const command: ICommand = {
        //     id: v1(),
        //     action: CommandAction.FieldsRefresh,
        // };
        // vscode.postMessage(command);

        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.command) {
                case "data":
                    console.log("GOT FIELDS MESSAGE");
                    setRows(message.data.fields);
                    if (message.data.selectedColumns === undefined) { 
                        setSelectedRows((): ReadonlySet<number> => new Set(message.data.fields.map(field => field.order)));   
                    } else {
                        const selected = message.data.fields.filter(row => message.data.selectedColumns.includes(row.name));
                        setSelectedRows((): ReadonlySet<number> => new Set(selected.map(row => row.order)));
                    }        
            }
        });
    });

    React.useEffect(() => {
       const command: ICommand = {
            id: v1(),
            action: CommandAction.UpdateColumns,
            columns: rows.filter(row => selectedRows.has(row.order)).map(row => row.name)
        };
        vscode.postMessage(command);
    });

    return (
        <div>
            {rows.length > 0 ? (
                <DataGrid
                    columns={[SelectColumn, ...columnName.columns]}
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
};

export default Fields;


