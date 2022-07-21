import { v1 as uuidv1, v1 } from "uuid";

export interface IConfig {
    id: string;
    name: string;
    description: string;
    host: string;
    port: string;
    user: string;
    password: string;
    alias: string;
    group: string;
    params: string;
}

export interface ICommand {
    id: string;
    action: CommandAction;
    content: IConfig;
}

export enum CommandAction {
    Save,
    Test,
    Query
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
    order: number;
    name: string;
    type: string;
    format: string;
    label: string;
    initial: string;
}

export interface TableDetails {
    fields: FieldRow[],
    indexes: IndexRow[]
}