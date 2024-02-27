import * as vscode from 'vscode';
import { TableNode } from './TableNode';
import { TablesListProvider } from './TablesListProvider';
import { PanelViewProvider } from '../webview/PanelViewProvider';
import { TableCount } from '../view/app/model';
import { Constants } from '../common/Constants';

export class FavoritesProvider extends TablesListProvider {
    public _onDidChangeTreeData: vscode.EventEmitter<
        TableNode | undefined | void
    > = new vscode.EventEmitter<TableNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TableNode | undefined | void> =
        this._onDidChangeTreeData.event;
    public tableClicked: TableCount = { tableName: undefined, count: 0 };

    constructor(
        fieldsProvider: PanelViewProvider,
        indexesProvider: PanelViewProvider,
        context: vscode.ExtensionContext
    ) {
        super(fieldsProvider, indexesProvider, context);
    }

    public getTreeItem(element: TableNode): vscode.TreeItem {
        const treeItem = element.getTreeItem();

        treeItem.command = {
            command: `${Constants.globalExtensionKey}.dblClickFavoriteQuery`,
            title: 'Open Favorite Table',
            arguments: [element],
        };

        return treeItem;
    }

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

        const filteredFavorites = favoritesData.filter((favorite) =>
            this.configs?.some((config) => config.id === favorite.dbId)
        );

        const favorites = filteredFavorites.map(
            (data) =>
                new TableNode(
                    this.context,
                    data.dbId,
                    data.tableName,
                    data.tableType,
                    data.connectionName,
                    data.connectionLabel,
                    'favorites'
                )
        );

        return favorites;
    }

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

        if (!isAlreadyFavorite) {
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
    }

    public removeTableFromFavorites(node: TableNode): void {
        let favorites = this.context.globalState.get<
            {
                dbId: string;
                tableName: string;
                tableType: string;
                connectionName: string;
                connectionLabel: string;
            }[]
        >('favorites', []);

        favorites = favorites.filter(
            (fav) =>
                !(fav.tableName === node.tableName && fav.dbId === node.dbId)
        );
        this.context.globalState.update('favorites', favorites);
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
}
