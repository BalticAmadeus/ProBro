import * as React from "react";
import { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";

import { IConfig, IndexRow } from "./model";
import DataGrid from "react-data-grid";
import type { SortColumn } from "react-data-grid";

import * as columnName from "./indexesColumn.json";

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        initialData: IConfig;
    }
}

const defaultColumnProperties = {
    sortable: true,
};

columnName.columns.map((c) => ({ ...c, ...defaultColumnProperties }));

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));

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

    console.log("rows: ", rows);
    console.log("sortColumns: ", sortColumns);
    console.log("selectedRows: ", selectedRows);

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

    console.log("rows data: ", sortedRows);

    return (
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
        />
    );
}

root.render(<Indexes initialData={window.initialData} vscode={vscode} />);
