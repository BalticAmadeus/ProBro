import * as React from "react";
import { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";

import { IConfig, FieldRow } from "./model";
import DataGrid from "react-data-grid";
import type { SortColumn } from "react-data-grid";

import * as columnName from "./column.json";

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        initialData: IConfig;
    }
}

const defaultColumnProperties = {
    sortable: true,
};

const columns = columnName.columns.map((c) => ({ ...c, ...defaultColumnProperties }));

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));

type Comparator = (a: FieldRow, b: FieldRow) => number;
function getComparator(sortColumn: string): Comparator {
    switch (sortColumn) {
        case "order":
            return (a, b) => {
                return a[sortColumn] - b[sortColumn];
            };
        case "name":
        case "type":
        case "format":
        case "label":
        case "initial":
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
    const [selectedRows, setSelectedRows] = useState<ReadonlySet<number>>(
        () => new Set()
    );

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

    return (
        <DataGrid
            columns={columns}
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

root.render(<Fields initialData={window.initialData} vscode={vscode} />);
