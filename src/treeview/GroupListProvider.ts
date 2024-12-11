import * as vscode from 'vscode';

import { IConfig } from '@app/model';
import { Constants } from '@src/common/Constants';
import { CustomViewProvider } from '@src/treeview/CustomViewProvider';
import { DbConnectionNode } from '@src/treeview/DbConnectionNode';
import { FavoritesProvider } from '@src/treeview/FavoritesProvider';
import * as groupNode from '@src/treeview/GroupNode';
import { INode } from '@src/treeview/INode';
import { IRefreshCallback } from '@src/treeview/IRefreshCallback';
import { TablesListProvider } from '@src/treeview/TablesListProvider';

export class GroupListProvider
    implements vscode.TreeDataProvider<INode>, IRefreshCallback
{
    private _onDidChangeTreeData: vscode.EventEmitter<
        INode | undefined | void
    > = new vscode.EventEmitter<INode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<INode | undefined | void> =
        this._onDidChangeTreeData.event;

    constructor(
        private context: vscode.ExtensionContext,
        private tables: vscode.TreeView<INode>
    ) {}

    onDidChangeSelection(
        e: vscode.TreeViewSelectionChangeEvent<INode>,
        tablesListProvider: vscode.TreeDataProvider<INode>,
        favoritesProvider: vscode.TreeDataProvider<INode>,
        customViewsProvider: vscode.TreeDataProvider<INode>
    ): any {
        if (e.selection.length) {
            if (
                e.selection[0] instanceof DbConnectionNode &&
                tablesListProvider instanceof TablesListProvider &&
                favoritesProvider instanceof FavoritesProvider &&
                customViewsProvider instanceof CustomViewProvider
            ) {
                const nodes = e.selection as DbConnectionNode[];
                const configs: IConfig[] = [];

                nodes.forEach((node) => {
                    configs.push(node.config);
                });

                console.log('GroupList', configs);
                tablesListProvider.refresh(configs);
                favoritesProvider.refresh(configs);
                customViewsProvider.refresh(configs);
                return;
            }
        }
        (tablesListProvider as TablesListProvider).refresh(undefined);
        (favoritesProvider as FavoritesProvider).refresh(undefined);
        (customViewsProvider as CustomViewProvider).refresh(undefined);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(
        element: INode
    ): Promise<vscode.TreeItem> | vscode.TreeItem {
        return element.getTreeItem();
    }

    public getChildren(element?: INode): Thenable<INode[]> | INode[] {
        if (!element) {
            return this.getGroupNodes();
        }
        return element.getChildren();
    }

    private async getGroupNodes(): Promise<groupNode.GroupNode[]> {
        const connections = this.context.globalState.get<{
            [key: string]: IConfig;
        }>(`${Constants.globalExtensionKey}.dbconfig`);

        const workspaceConnections = this.context.workspaceState.get<{
            [key: string]: IConfig;
        }>(`${Constants.globalExtensionKey}.dbconfig`);

        const groupNodes: groupNode.GroupNode[] = [];
        const groupNames: string[] = [];
        if (connections) {
            for (const id of Object.keys(connections)) {
                let group = connections[id].group.toUpperCase();
                if (!group) {
                    group = '<EMPTY>';
                }
                if (groupNames.indexOf(group) === -1) {
                    groupNames.push(group);
                    groupNodes.push(
                        new groupNode.GroupNode(this.context, group, this)
                    );
                }
            }
        }

        if (workspaceConnections) {
            for (const id of Object.keys(workspaceConnections)) {
                let group = workspaceConnections[id].group.toUpperCase();
                if (!group) {
                    group = '<EMPTY>';
                }
                if (groupNames.indexOf(group) === -1) {
                    groupNames.push(group);
                    groupNodes.push(
                        new groupNode.GroupNode(this.context, group, this)
                    );
                }
            }
        }
        return groupNodes;
    }
}
