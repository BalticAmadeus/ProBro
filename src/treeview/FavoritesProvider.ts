import * as vscode from 'vscode';
import { TableNode, TableNodeSourceEnum } from './TableNode';
import { TablesListProvider } from './TablesListProvider';
import { GroupListProvider } from './GroupListProvider';
import { PanelViewProvider } from '../webview/PanelViewProvider';
import { Constants } from '../common/Constants';
import {
    SavedTable,
    savedItemMatchesConnection,
    updateSavedItems,
} from '../common/SavedItems';

function isSameTable(fav: SavedTable, node: TableNode): boolean {
    return (
        fav.tableName === node.tableName &&
        fav.dbId === node.dbId &&
        fav.connectionName === node.connectionName
    );
}

export class FavoritesProvider extends TablesListProvider {
    public _onDidChangeTreeData: vscode.EventEmitter<
        TableNode | undefined | void
    > = new vscode.EventEmitter<TableNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TableNode | undefined | void> =
        this._onDidChangeTreeData.event;

    constructor(
        fieldsProvider: PanelViewProvider,
        indexesProvider: PanelViewProvider,
        context: vscode.ExtensionContext,
        groupListProvider: GroupListProvider
    ) {
        super(fieldsProvider, indexesProvider, context, groupListProvider);
    }

    /**
     * Gets the tree item for a given table node. Adds a command to open the favorite table when double-clicked.
     * @param element The table node to get the tree item for.
     * @returns The tree item for the provided table node.
     */
    public getTreeItem(element: TableNode): vscode.TreeItem {
        const treeItem = element.getTreeItem();

        treeItem.command = {
            command: `${Constants.globalExtensionKey}.dblClickFavoriteQuery`,
            title: 'Open Favorite Table',
            arguments: [element],
        };

        return treeItem;
    }

    /**
     * Retrieves the list of favorite table nodes.
     * @returns A promise that resolves to an array of TableNode objects representing the favorites.
     */
    private async getFavorites(): Promise<TableNode[]> {
        const favoritesData = this.context.workspaceState.get<SavedTable[]>(
            'favorites',
            [],
        );

        const filteredFavorites = favoritesData.filter((favorite) => {
            return (
                savedItemMatchesConnection(favorite, this.getLatestConfig(favorite.dbId)) &&
                this.isDbIdSelected(favorite.dbId)
            );
        });

        const favorites = filteredFavorites.map(
            (data) =>
                new TableNode(
                    this.context,
                    data.dbId,
                    data.tableName,
                    data.tableType,
                    data.connectionName,
                    data.connectionLabel,
                    TableNodeSourceEnum.Favorites
                )
        );

        return favorites;
    }

    /**
     * Adds a table to the list of favorites.
     * @param node The table node to add to favorites.
     */
    public async addTableToFavorites(node: TableNode): Promise<void> {
        const added = await updateSavedItems<SavedTable>(
            this.context.workspaceState,
            'favorites',
            (favorites) =>
                favorites.some((fav) => isSameTable(fav, node))
                    ? undefined
                    : [
                        ...favorites,
                        {
                            dbId: node.dbId,
                            tableName: node.tableName,
                            tableType: node.tableType,
                            connectionName: node.connectionName,
                            connectionLabel: node.connectionLabel,
                        },
                    ],
        );
        if (added) {
            vscode.window.showInformationMessage(
                `Added ${node.tableName} to favorites.`
            );
        }
    }

    /**
     * Removes a table from the list of favorites.
     * @param node The table node to remove from favorites.
     */
    public async removeTableFromFavorites(node: TableNode): Promise<void> {
        const removed = await updateSavedItems<SavedTable>(
            this.context.workspaceState,
            'favorites',
            (favorites) =>
                favorites.length === 0
                    ? undefined
                    : favorites.filter((fav) => !isSameTable(fav, node)),
        );
        if (removed) {
            vscode.window.showInformationMessage(
                `Removed ${node.tableName} from favorites.`
            );
        }
    }

    public async getChildren(element?: TableNode): Promise<TableNode[]> {
        if (!element) {
            return this.getFavorites();
        } else {
            return [];
        }
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}
