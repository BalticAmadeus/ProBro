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
    Test
}

export interface FieldRow {
    order: number;
    name: string;
    type: string;
    format: string;
    label: string;
    initial: string;
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