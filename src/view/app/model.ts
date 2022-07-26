import { v1 as uuidv1, v1 } from "uuid";

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
    params?: any;
}

export interface IQueryParams {
    tableName: string;
}


export enum CommandAction {
    Save,
    Test,
    Query,
    FieldsRefresh
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
    indexes: IndexRow[]
}
