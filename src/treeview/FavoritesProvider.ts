import * as vscode from 'vscode';
import { TableNode, TableNodeSourceEnum } from './TableNode';
import { TablesListProvider } from './TablesListProvider';
import { GroupListProvider } from './GroupListProvider';
import { PanelViewProvider } from '../webview/PanelViewProvider';
import { Constants } from '../common/Constants';

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
        const favoritesData = this.context.globalState.get<
            {
                dbId: string;
                tableName: string;
                tableType: string;
                connectionName: string;
                connectionLabel: string;
            }[]
        >('favorites', []);

        const filteredFavorites = favoritesData.filter((favorite) => {
            return (
                this.getLatestConfig(favorite.dbId) !== undefined &&
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
    public addTableToFavorites(node: TableNode): void {
        const favorites = this.context.globalState.get<
            {
                dbId: string;
                tableName: string;
                tableType: string;
                connectionName: string;
                connectionLabel: string;
            }[]
        >('favorites', []);

        const isAlreadyFavorite = favorites.some(
            (fav) => fav.tableName === node.tableName && fav.dbId === node.dbId
        );

        if (isAlreadyFavorite) {
            return;
        }
        favorites.push({
            dbId: node.dbId,
            tableName: node.tableName,
            tableType: node.tableType,
            connectionName: node.connectionName,
            connectionLabel: node.connectionLabel,
        });

        this.context.globalState.update('favorites', favorites);
        vscode.window.showInformationMessage(
            `Added ${node.tableName} to favorites.`
        );
    }

    /**
     * Removes a table from the list of favorites.
     * @param node The table node to remove from favorites.
     */
    public removeTableFromFavorites(node: TableNode): void {
        const favorites = this.context.globalState.get<
            {
                dbId: string;
                tableName: string;
                tableType: string;
                connectionName: string;
                connectionLabel: string;
            }[]
        >('favorites', []);

        if (favorites.length === 0) {
            return;
        }

        const filteredFavorites = favorites.filter(
            (fav) =>
                !(fav.tableName === node.tableName && fav.dbId === node.dbId)
        );
        this.context.globalState.update('favorites', filteredFavorites);
        vscode.window.showInformationMessage(
            `Removed ${node.tableName} from favorites.`
        );
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
