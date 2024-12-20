import { SortColumn } from 'react-data-grid';

export class ConnectionParams {
    constructor(public host: string, public port: number) {}
}

export interface IConfig {
    type: ConnectionType.Local;
    connectionId: 'LOCAL';
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
    conStatus?: ConnectionStatus;
    workState?: boolean;
    isReadOnly: boolean;
}

export interface IRemoteConnectionConfig {
    type: ConnectionType.Remote;
    connectionId: string;
    agentConParams: ConnectionParams;
    agentDatabaseName: string;
    conStatus?: ConnectionStatus;
}

export type IConnectionConfig = IConfig | IRemoteConnectionConfig;

export enum ConnectionType {
    Local,
    Remote,
}

export enum ConnectionStatus {
    Connected,
    Connecting,
    NotConnected,
}

export interface ICommand {
    id: string;
    action: CommandAction;
    content?: IConfig;
    params?: ITableData;
    columns?: string[];
    customView?: ICustomView;
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
    UpdateColumns,
    RefreshTableData,
    Group,
    FieldsHighlightColumn,
    SaveCustomQuery,
}

export interface FieldRow {
    order: number;
    name: string;
    type: string;
    format: string;
    label: string;
    initial: string;
    columnLabel: string;
    mandatory: 'yes' | 'no';
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

export interface Debug {
    start: string;
    startConnect: string;
    end: string;
    endConnect: string;
    time: number;
    timeConnect: number;
}

export interface TableDetails {
    tableName: string;
    fields: FieldRow[];
    indexes: IndexRow[];
    selectedColumns?: string[];
    debug?: Debug;
}

export enum ProcessAction {
    Insert,
    Update,
    Delete,
    Submit,
    Read,
    Copy,
}

export enum DataToExport {
    Table,
    Filter,
    Selection,
}

export interface ITableData {
    wherePhrase?: string;
    start: number;
    pageLength: number;
    minTime: number;
    lastRowID: string;
    sortColumns?: SortColumn[];
    filters?: any;
    timeOut: number;
    crud?: string[];
    data?: {
        key: string;
        value: string | number | boolean;
        defaultValue: string | number | boolean;
    }[];
    mode?: string;
    exportType?: string;
    useWriteTriggers?: boolean;
    useDeleteTriggers?: boolean;
}

export interface TableCount {
    tableName: string | undefined;
    count: number;
}

export interface IPort {
    port: number;
    isInUse: boolean;
    timestamp: number | undefined;
}

export interface ICustomView {
    name: string;
    wherePhrase: string;
    sortColumns: SortColumn[];
    filters: any;
    useWriteTriggers: boolean;
    useDeleteTriggers: boolean;
}
