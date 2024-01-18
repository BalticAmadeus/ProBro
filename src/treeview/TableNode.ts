import * as vscode from 'vscode';
import { TableDetails } from '../view/app/model';
import { INode } from './INode';

export class TableNode implements INode {
    public tableName: string;
    public tableType: string;
    public connectionName: string;
    public connectionLabel: string;
    public cache: TableDetails | undefined;

    constructor(
    private context: vscode.ExtensionContext,
    tableName: string,
    tableType: string,
    connectionName: string,
    connectionLabel: string
    ) {
        this.tableName = tableName;
        this.tableType = tableType;
        this.connectionName = connectionName;
        this.connectionLabel = connectionLabel;
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.tableName,
            description: this.connectionLabel,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'table',
        };
    }

    public async getChildren(): Promise<INode[]> {
        return [];
    }

    public getFullName(): string {
        return this.connectionLabel + '.' + this.tableName;
    }
}
