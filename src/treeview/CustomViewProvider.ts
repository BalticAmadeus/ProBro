import * as vscode from 'vscode';
import { INode } from './INode';
import { TablesListProvider } from './TablesListProvider';
import { TableNode, TableNodeSourceEnum } from './TableNode';
import { IConfig } from '../view/app/model';
import { PanelViewProvider } from '../webview/PanelViewProvider';
import { FieldsViewProvider } from '../webview/FieldsViewProvider';
import { ITableData } from '../view/app/model';

export class CustomViewProvider extends TablesListProvider {
    public _onDidChangeTreeData: vscode.EventEmitter<
        TableNode | undefined | void
    > = new vscode.EventEmitter<TableNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TableNode | undefined | void> =
        this._onDidChangeTreeData.event;
    public configs: IConfig[] | undefined;
    constructor(
        fieldProvider: PanelViewProvider,
        indexesProvider: PanelViewProvider,
        context: vscode.ExtensionContext
    ) {
        super(fieldProvider, indexesProvider, context);
    }

    public getTreeItem(element: CustomViewNode): vscode.TreeItem {
        return element.getTreeItem();
    }
    public async getChildren(
        element?: CustomViewNode
    ): Promise<CustomViewNode[]> {
        if (!element) return this.getCustomQueries();
        else return [];
    }

    saveCustomQuery(node: CustomViewNode): void {
        const customQueryData = this.context.globalState.get<
            {
                dbId: string;
                tableName: string;
                tableType: string;
                connectionName: string;
                connectionLabel: string;
                name: string;
                tableData: ITableData | undefined;
            }[]
        >('custom-views', []);
        console.log('TableNode', node);
        //ToDo:
        //Add Logic to detect same views.
        console.log('customBefore', customQueryData);
        customQueryData.push({
            dbId: node.dbId,
            tableName: node.tableName,
            tableType: node.tableType,
            connectionName: node.connectionName,
            connectionLabel: node.connectionLabel,
            name: node.name,
            tableData: node.tableData,
        });
        console.log('customafter', customQueryData);
        this.context.globalState.update('custom-views', customQueryData);
        vscode.window.showInformationMessage(
            `Custom view ${node.name} was added.`
        );
    }

    private async getCustomQueries(): Promise<CustomViewNode[]> {
        const customQueryData = this.context.globalState.get<
            {
                dbId: string;
                tableName: string;
                tableType: string;
                connectionName: string;
                connectionLabel: string;
                name: string;
                tableData: ITableData;
            }[]
        >('custom-views', []);

        const filteredCustomQueries = customQueryData.filter((customQuery) =>
            this.configs?.some((config) => config.id === customQuery.dbId)
        );

        const customQuery = filteredCustomQueries.map(
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
                        TableNodeSourceEnum.Favorites
                    ),
                    data.name,
                    data.tableData
                )
        );
        return customQuery;
    }

    public removeTableFromCustomViews(node: CustomViewNode): void {
        const favorites = this.context.globalState.get<
            {
                dbId: string;
                tableName: string;
                tableType: string;
                connectionName: string;
                connectionLabel: string;
                name: string;
                customQuery: string;
            }[]
        >('custom-views', []);

        if (favorites.length === 0) {
            return;
        }
        console.log('node', node);
        console.log('favbefore', favorites);
        const filteredFavorites = favorites.filter(
            (fav) => !(fav.name === node.name && fav.dbId === node.dbId)
        );
        console.log('favafter', filteredFavorites);
        this.context.globalState.update('custom-views', filteredFavorites);
        vscode.window.showInformationMessage(
            `Removed ${node.name} from custom view.`
        );
    }

    public refresh(configs: IConfig[] | undefined): void {
        if (configs !== undefined) {
            this.configs = configs;
        }
        this._onDidChangeTreeData.fire();
    }
}

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
