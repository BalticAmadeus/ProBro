import * as vscode from 'vscode';
import { TablesListProvider } from './TablesListProvider';
import { TableNode, TableNodeSourceEnum } from './TableNode';
import { IConfig } from '../view/app/model';
import { PanelViewProvider } from '../webview/PanelViewProvider';
import { ITableData } from '../view/app/model';
import { CustomViewNode } from './CustomViewNode';

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
        if (!element) return this.getCustomViews();
        else return [];
    }

    saveCustomView(node: CustomViewNode): void {
        const customViewData = this.context.globalState.get<
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
        //ToDo:
        //Add Logic to detect same views.
        customViewData.push({
            dbId: node.dbId,
            tableName: node.tableName,
            tableType: node.tableType,
            connectionName: node.connectionName,
            connectionLabel: node.connectionLabel,
            name: node.name,
            tableData: node.tableData,
        });
        this.context.globalState.update('custom-views', customViewData);
        vscode.window.showInformationMessage(
            `Custom view ${node.name} was added.`
        );
    }

    private async getCustomViews(): Promise<CustomViewNode[]> {
        const customViewData = this.context.globalState.get<
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
        const filteredCustomViews = customViewData.filter((customView) =>
            this.configs?.some((config) => config.id === customView.dbId)
        );

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
                        TableNodeSourceEnum.Favorites
                    ),
                    data.name,
                    data.tableData
                )
        );
        return customViews;
    }

    public removeCustomViews(node: CustomViewNode): void {
        const customViewData = this.context.globalState.get<
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

        if (customViewData.length === 0) {
            return;
        }

        const filteredCustomViews = customViewData.filter(
            (customView) =>
                !(
                    customView.name === node.name &&
                    customView.dbId === node.dbId
                )
        );

        this.context.globalState.update('custom-views', filteredCustomViews);
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
