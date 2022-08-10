import * as React from "react";
import { useState, useMemo } from "react";


import { CommandAction, ICommand, IndexRow } from "../model";
import DataGrid from "react-data-grid";
import type { SortColumn } from "react-data-grid";

import * as columnName from "./column.json";
import { v1 } from "uuid";

type Comparator = (a: IndexRow, b: IndexRow) => number;
function getComparator(sortColumn: string): Comparator {
    switch (sortColumn) {
        case "cName":
        case "cFlags":
        case "cFields":
            return (a, b) => {
                return a[sortColumn].localeCompare(b[sortColumn]);
            };
        default:
            throw new Error(`unsupported sortColumn: "${sortColumn}"`);
    }
}

function rowKeyGetter(row: IndexRow) {
    return row.cName;
}

function Indexes({ initialData, vscode }) {
    const [rows, setRows] = useState(initialData.indexes as IndexRow[]);
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
        () => new Set()
    );
    const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

    const windowRezise = () => {
        setWindowHeight(window.innerHeight);
    };

    React.useEffect(() => {
        window.addEventListener('resize', windowRezise);

        return () => {
            window.removeEventListener('resize', windowRezise);
        };
    }, []);

    const sortedRows = useMemo((): readonly IndexRow[] => {
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
                    console.log("GOT INDEXES MESSAGE");
                    setRows(message.data.indexes);
            }
        });
    });

    return (
        <div>
            {rows.length > 0 ? (
                <DataGrid
                    columns={columnName.columns}
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
                    style={{ height: windowHeight}}
                />
            ) : null}
        </div>
    );
}

export default Indexes;
