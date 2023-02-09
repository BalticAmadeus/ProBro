import { Column } from "react-data-grid";

export interface IOEVersion {
    dbversion: string,
    proversion: string
}

export interface IOEError {
    error: number,
    description: string,
    trace: string
}

export interface IOETablesList {
    tables: ITable[]
}

export interface IOEParams {
    connectionString: string,
    command: string,
    params?: any
}

export interface IOETableData {
    columns: Column<string, unknown>[],
    data: string[]
}

interface ITable {
    name: string,
    tableType: string
}

export interface IExportDumpData {
    rawData: any[],
    columns: IOeColumn[],
    psc: IOePsc
}

interface IOeColumn {
    name: string,
    key: string,
    label: string,
    type: string,
    format: string | null
}
interface IOePsc {
    cpstream: string,
    dateformat: string,
    numformat: string,
    timestamp: string
}