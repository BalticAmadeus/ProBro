import * as vscode from "vscode";
import { TableDetails } from "../view/app/model";
import { INode } from "./INode";

export class TableNode implements INode {
    public tableName: string;
    public tableType: string;
    public connectionName: string;
    public cache: TableDetails | undefined;

    constructor(private context: vscode.ExtensionContext, tableName: string, tableType: string, connectionName: string) {
        this.tableName = tableName;
        this.tableType = tableType;
        this.connectionName = connectionName;
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.tableName,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "table",
        };
    }

    public async getChildren(): Promise<INode[]> {
        return [];
    }

    public getFullName(): string { 
        return this.connectionName + "." + this.tableName;
    }

}