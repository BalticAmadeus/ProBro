import * as vscode from 'vscode';
import { Constants } from '../common/Constants';
import { INode } from './INode';
import * as groupNode from './GroupNode';
import { IConfig } from '../view/app/model';
import { IRefreshCallback } from './IRefreshCallback';
import { TablesListProvider } from './TablesListProvider';
import { FavoritesProvider } from './FavoritesProvider';
import { CustomViewProvider } from './CustomViewProvider';
import { DbConnectionNode } from './DbConnectionNode';

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
    private selectedIds: string[] = [];
    
    constructor(
        private context: vscode.ExtensionContext
    ) {
    }

    public setProviders(
        tablesProvider: TablesListProvider,
        favoritesProvider: FavoritesProvider,
        customViewsProvider: CustomViewProvider
    ): void {
        this.tablesProvider = tablesProvider;
        this.favoritesProvider = favoritesProvider;
        this.customViewsProvider = customViewsProvider;
    }

    public async onDidChangeSelection(
        e: vscode.TreeViewSelectionChangeEvent<INode>
    ): Promise<void> {
        if (!e.selection.length) {
            this.selectedIds = [];
            this.refreshDependentViews();
            return;
        }

        const ids: string[] = [];

        for (const selected of e.selection) {
            if (selected instanceof DbConnectionNode) {
                ids.push(selected.config.id);
                continue;
            }

            if (selected instanceof groupNode.GroupNode) {
                const children = await selected.getChildren();
                children.forEach((child) => {
                    if (child instanceof DbConnectionNode) {
                        ids.push(child.config.id);
                    }
                });
            }
        }

        this.selectedIds = ids;
        this.refreshDependentViews();
    }

    /**
     * Resolves the selected connection ids against live stored configs,
     * so edits to connection parameters are always picked up.
     */
    public getSelectedConfigs(): IConfig[] {
        return this.selectedIds
            .map((id) => this.getConfigByGroup(id))
            .filter((config): config is IConfig => config !== undefined);
    }

    /**
     * Refreshes the views that depend on the selected connections.
     */
    public refreshDependentViews(): void {
        this.tablesProvider?.refresh();
        this.favoritesProvider?.refresh();
        this.customViewsProvider?.refresh();
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

    public getConfigByGroup(group: string): IConfig | undefined {
        const connections = this.context.globalState.get<{
            [key: string]: IConfig;
        }>(`${Constants.globalExtensionKey}.dbconfig`);

        if (connections) {
            // return config if available
            const config = Object.values(connections).find((config) => config.id.toUpperCase() === group.toUpperCase());
            if (config) {
                return config;
            }
        }

        const workspaceConnections = this.context.workspaceState.get<{
            [key: string]: IConfig;
        }>(`${Constants.globalExtensionKey}.dbconfig`);

        if (workspaceConnections) {
            // return config if available
            const config = Object.values(workspaceConnections).find((config) => config.id.toUpperCase() === group.toUpperCase());
            if (config) {
                return config;
            }
        }

        console.warn(`No configuration found for group: ${group}`);
        return undefined;
    }
}
