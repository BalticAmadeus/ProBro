import * as vscode from 'vscode';
import { TableDetails } from '../view/app/model';
import { INode } from './INode';

export class TableNode implements INode {
    public dbId: string;
    public tableName: string;
    public tableType: string;
    public connectionName: string;
    public connectionLabel: string;
    public cache: TableDetails | undefined;
    public source: 'tables' | 'favorites';

    constructor(
        private context: vscode.ExtensionContext,
        dbId: string,
        tableName: string,
        tableType: string,
        connectionName: string,
        connectionLabel: string,
        source: 'tables' | 'favorites'
    ) {
        this.dbId = dbId;
        this.tableName = tableName;
        this.tableType = tableType;
        this.connectionName = connectionName;
        this.connectionLabel = connectionLabel;
        this.source = source;
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

    public getFullName(includeId = false): string {
        const dbString = includeId ? `${this.dbId}_` : '';
        return `${dbString}${this.connectionLabel}.${this.tableName}`;
    }
}
