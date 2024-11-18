import * as vscode from 'vscode';
import { TableNode } from './TableNode';
import { ITableData } from '../view/app/model';

export class CustomViewNode extends TableNode {
    public name: string;
    public tableData: ITableData | undefined;

    constructor(
        context: vscode.ExtensionContext,
        table: TableNode,
        name: string,
        tableData: ITableData | undefined
    ) {
        super(
            context,
            table.dbId,
            table.tableName,
            table.tableType,
            table.connectionName,
            table.connectionLabel,
            table.source
        );
        this.name = name;
        this.tableData = tableData;
    }

    public override getTreeItem(): vscode.TreeItem {
        return {
            label: this.name,
            description: this.tableName,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
        };
    }
}
