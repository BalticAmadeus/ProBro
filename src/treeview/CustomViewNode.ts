import * as vscode from 'vscode';
import { TableNode } from './TableNode';
import { ICustomView } from '../view/app/model';

export class CustomViewNode extends TableNode {
    public name: string;
    public customViewParams: ICustomView | undefined;

    constructor(
        context: vscode.ExtensionContext,
        table: TableNode,
        name: string,
        customViewParams: ICustomView | undefined
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
        this.customViewParams = customViewParams;
    }

    public override getTreeItem(): vscode.TreeItem {
        return {
            label: this.name,
            description: this.tableName,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            tooltip: this.connectionLabel,
        };
    }
}
