import * as vscode from 'vscode';
import { TablesListProvider } from './TablesListProvider';
import { TableNode, TableNodeSourceEnum } from './TableNode';
import { PanelViewProvider } from '../webview/PanelViewProvider';
import { CustomViewNode } from './CustomViewNode';
import { Constants } from '../common/Constants';
import { GroupListProvider } from './GroupListProvider';
import {
    SavedCustomView,
    savedItemMatchesConnection,
    updateSavedItems,
} from '../common/SavedItems';

function isSameView(view: SavedCustomView, node: CustomViewNode): boolean {
    return (
        view.name === node.name &&
        view.dbId === node.dbId &&
        view.tableName === node.tableName &&
        view.connectionName === node.connectionName
    );
}

export class CustomViewProvider extends TablesListProvider {
    public override node: CustomViewNode | undefined;

    public _onDidChangeTreeData: vscode.EventEmitter<
        TableNode | undefined | void
    > = new vscode.EventEmitter<TableNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TableNode | undefined | void> =
        this._onDidChangeTreeData.event;
    constructor(
        fieldProvider: PanelViewProvider,
        indexesProvider: PanelViewProvider,
        context: vscode.ExtensionContext,
        groupListProvider: GroupListProvider
    ) {
        super(fieldProvider, indexesProvider, context, groupListProvider);
    }

    /**
     * Gets the tree item for a given table node. Adds a command to open the favorite table when double-clicked.
     * @param element The table node to get the tree item for.
     * @returns The tree item for the provided table node.
     */
    public getTreeItem(element: TableNode): vscode.TreeItem {
        const treeItem = element.getTreeItem();

        treeItem.command = {
            command: `${Constants.globalExtensionKey}.dblClickCustomViewQuery`,
            title: 'Open Favorite Table',
            arguments: [element],
        };

        return treeItem;
    }
    public async getChildren(
        element?: CustomViewNode
    ): Promise<CustomViewNode[]> {
        if (!element) {return this.getCustomViews();}
        else {return [];}
    }

    async saveCustomView(node: CustomViewNode): Promise<void> {
        let duplicate = false;
        const saved = await updateSavedItems<SavedCustomView>(
            this.context.workspaceState,
            'custom-views',
            (customViews) => {
                duplicate = customViews.some((view) => isSameView(view, node));
                return duplicate
                    ? undefined
                    : [
                        ...customViews,
                        {
                            dbId: node.dbId,
                            tableName: node.tableName,
                            tableType: node.tableType,
                            connectionName: node.connectionName,
                            connectionLabel: node.connectionLabel,
                            name: node.name,
                            customViewParams: node.customViewParams,
                        },
                    ];
            },
        );

        if (duplicate) {
            vscode.window.showErrorMessage(
                `Could not save "${node.name}" for table "${node.tableName}". Change the preference name.`
            );
        } else if (saved) {
            vscode.window.showInformationMessage(
                `Custom view ${node.name} was added.`
            );
        }
    }

    private async getCustomViews(): Promise<CustomViewNode[]> {
        const customViewData = this.context.workspaceState.get<SavedCustomView[]>(
            'custom-views',
            [],
        );
        const filteredCustomViews = customViewData.filter((customView) => {
            return (
                savedItemMatchesConnection(customView, this.getLatestConfig(customView.dbId)) &&
                this.isDbIdSelected(customView.dbId)
            );
        });

        const customViews = filteredCustomViews.map(
            (data) =>
                new CustomViewNode(
                    this.context,
                    new TableNode(
                        this.context,
                        data.dbId,
                        data.tableName,
                        data.tableType,
                        data.connectionName,
                        data.connectionLabel,
                        TableNodeSourceEnum.Custom
                    ),
                    data.name,
                    data.customViewParams
                )
        );
        return customViews;
    }

    public async removeCustomViews(node: CustomViewNode): Promise<void> {
        const removed = await updateSavedItems<SavedCustomView>(
            this.context.workspaceState,
            'custom-views',
            (customViews) =>
                customViews.length === 0
                    ? undefined
                    : customViews.filter((view) => !isSameView(view, node)),
        );
        if (removed) {
            vscode.window.showInformationMessage(
                `Removed ${node.name} from custom view.`
            );
        }
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}
