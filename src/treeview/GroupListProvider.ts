import * as vscode from 'vscode';
import { Constants } from '../common/Constants';
import { INode } from './INode';
import * as groupNode from './GroupNode';
import { IConfig } from '../view/app/model';
import { TablesListProvider } from './TablesListProvider';
import { DbConnectionNode } from './DbConnectionNode';
import { IRefreshCallback } from './IRefreshCallback';
import { FavoritesProvider } from './FavoritesProvider';
import { CustomViewProvider } from './CustomViewProvider';

export class GroupListProvider
implements vscode.TreeDataProvider<INode>, IRefreshCallback
{
    private _onDidChangeTreeData: vscode.EventEmitter<
        INode | undefined | void
    > = new vscode.EventEmitter<INode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<INode | undefined | void> =
        this._onDidChangeTreeData.event;
    private tablesProvider: TablesListProvider | undefined;
    private favoritesProvider: FavoritesProvider | undefined;
    private customViewsProvider: CustomViewProvider | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        private tables: TablesListProvider,
        private favorites: FavoritesProvider,
        private customViews: CustomViewProvider
    ) {
        this.tablesProvider = tables;
        this.favoritesProvider = favorites;
        this.customViewsProvider = customViews;
    }

    onDidChangeSelection(
        e: vscode.TreeViewSelectionChangeEvent<INode>
    ): any {
        if (e.selection.length) {
            if (e.selection[0] instanceof DbConnectionNode) {
                const nodes = e.selection as DbConnectionNode[];
                const configs: IConfig[] = [];

                nodes.forEach((node) => {
                    configs.push(node.config);
                });

                console.log('GroupList', configs);
                this.tablesProvider?.refresh(configs);
                this.favoritesProvider?.refresh(configs);
                this.customViewsProvider?.refresh(configs);
                return;
            }
        }
        this.tablesProvider?.refresh(undefined);
        this.favoritesProvider?.refresh(undefined);
        this.customViewsProvider?.refresh(undefined);
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

    updateProviders( configs: IConfig[] | undefined): void {
        const tablesProviderConfigs: IConfig[] | undefined = configs?.filter((config) => this.tablesProvider?.tableNodes.map((node) => node.dbId).includes(config.id));
        const favoritesProviderConfigs: IConfig[] | undefined = configs?.filter((config) => this.favoritesProvider?.tableNodes.map((node) => node.dbId).includes(config.id));
        const customViewsProviderConfigs: IConfig[] | undefined = configs?.filter((config) => this.customViewsProvider?.tableNodes.map((node) => node.dbId).includes(config.id));

        this.tablesProvider?.refresh(tablesProviderConfigs);
        this.favoritesProvider?.refresh(favoritesProviderConfigs);
        this.customViewsProvider?.refresh(customViewsProviderConfigs);
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

        this.updateProviders([...Object.values(connections || {}), 
            ...Object.values(workspaceConnections || {})]);

        return groupNodes;
    }
}
