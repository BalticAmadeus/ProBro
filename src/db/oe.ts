import { Column } from "react-data-grid";

export interface IOEVersion {
    dbversion: string;
    proversion: string;
}

export interface IOETablesList {
    tables: string[];
}

export interface IOEParams {
    connectionString: string;
    command: string;
    params?: string
}

export interface IOETableData {
    columns: Column<string, unknown>[],
    data: string[]
}