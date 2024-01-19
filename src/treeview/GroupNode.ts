import * as vscode from 'vscode';
import { DatabaseListProvider } from './DatabaseListProvider';
import { INode } from './INode';
import { IRefreshCallback } from './IRefreshCallback';

export class GroupNode implements INode {
    constructor(private context: vscode.ExtensionContext, private readonly groupName: string, private readonly refreshCallback: IRefreshCallback) {}


    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.groupName,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: 'group',
        };
    }

    public async getChildren(): Promise<INode[]> {
        return new DatabaseListProvider(this.context, this.groupName, this.refreshCallback).getChildren();
    }

}