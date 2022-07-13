import * as React from 'react';
import { useState, useMemo } from 'react';
import { createRoot } from "react-dom/client";

import { IConfig } from "./model";
import DataGrid from "react-data-grid";
import type {SortColumn } from 'react-data-grid';
import createRowData from "./fakeFieldsData";

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        initialData: IConfig;
    }
}

interface Row {
  order: number
  name: string;
  type: string;
  format: string;
  label: string;
  initial: string;
}

const defaultColumnProperties = {
  sortable: true,
};

const columns = [
  {
    key: "order",
    name: "Order",
    width: 100,
  },
  {
    key: "name",
    name: "Name",
    width: 100,
  },
  {
    key: "type",
    name: "Type",
    width: 100,
  },
  {
    key: "format",
    name: "Format",
    width: 100,
  },
  {
    key: "label",
    name: "Label",
    width: 100,
  },
  {
    key: "initial",
    name: "Initial",
  },
].map(c => ({ ...c, ...defaultColumnProperties }));
  

const root = createRoot(document.getElementById("root"));
const ROW_COUNT = 50;

type Comparator = (a: Row, b: Row) => number;
function getComparator(sortColumn: string): Comparator {
  switch (sortColumn) {
    case 'order':
      return (a, b) => {
        return a[sortColumn] - b[sortColumn];
      };
    case 'name':
    case 'type':
    case 'format':
    case 'label':
    case 'initial':
      return (a, b) => {
        return a[sortColumn].localeCompare(b[sortColumn]);
      };
    default:
      throw new Error(`unsupported sortColumn: "${sortColumn}"`);
  }
}

function rowKeyGetter(row: Row) {
  return row.order;
}

function Fields({ initialRows }) {
  const [rows, setRows] = useState(initialRows);
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<number>>(() => new Set());

  const sortedRows = useMemo((): readonly Row[] => {
    if (sortColumns.length === 0) {return rows;}

    return [...rows].sort((a, b) => {
      for (const sort of sortColumns) {
        const comparator = getComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === 'ASC' ? compResult : -compResult;
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

root.render(<Fields initialRows={createRowData(ROW_COUNT)} />);
