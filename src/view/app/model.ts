import { SortColumn } from "react-data-grid";

export interface IConfig {
    id: string;
    label: string;
    name: string;
    description: string;
    host: string;
    port: string;
    user: string;
    password: string;
    group: string;
    params: string;
}

export interface ICommand {
    id: string;
    action: CommandAction;
    content?: IConfig;
    params?: ITableData;
    columns?: string[];
}

export interface IQueryParams {
    tableName: string;
}


export enum CommandAction {
    Save,
    Test,
    Query,
    FieldsRefresh,
    Export,
    CRUD,
    Submit,
    UpdateColumns
}

export interface FieldRow {
    order: number;
    name: string;
    type: string;
    format: string;
    label: string;
    initial: string;
    columnLabel: string;
    mandatory: string;
    extent: number;
    decimals: number;
    rpos: number;
    valexp: string;
    valMessage: string;
    helpMsg: string;
    description: string;
    viewAs: string;
}

export interface IndexRow {
    cName: string;
    cFlags: string;
    cFields: string;
}

export interface TableDetails {
    fields: FieldRow[],
    indexes: IndexRow[],
    selectedColumns?: string[]
}

export enum ProcessAction {
    Insert,
    Update,
    Delete,
    Submit,
    Read
}

export interface ITableData {
    wherePhrase?: string,
    start: number,
    pageLength: number,
    lastRowID: string,
    sortColumns?: SortColumn[],
    filters?: any,
    timeOut: number,
    crud?: string[],
    data?: { key: string; value: string | number | boolean; defaultValue: string | number | boolean }[],
    mode?: string,
    exportType?: string
}