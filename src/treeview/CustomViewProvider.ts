import * as vscode from 'vscode';
import { TablesListProvider } from './TablesListProvider';
import { TableNode, TableNodeSourceEnum } from './TableNode';
import { IConfig, ICustomView } from '../view/app/model';
import { PanelViewProvider } from '../webview/PanelViewProvider';
import { CustomViewNode } from './CustomViewNode';
import { Constants } from '../common/Constants';

export class CustomViewProvider extends TablesListProvider {
    public override node: CustomViewNode | undefined;

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
                customViewParams: ICustomView | undefined;
            }[]
        >('custom-views', []);

        const matchingCustomView = customViewData.find(
            (customView) =>
                customView.dbId === node.dbId &&
                customView.name === node.name &&
                customView.tableName === node.tableName
        );

        if (matchingCustomView) {
            vscode.window.showErrorMessage(
                `Could not save "${node.name}" for table "${node.tableName}". Change the preference name.`
            );
            return;
        }

        customViewData.push({
            dbId: node.dbId,
            tableName: node.tableName,
            tableType: node.tableType,
            connectionName: node.connectionName,
            connectionLabel: node.connectionLabel,
            name: node.name,
            customViewParams: node.customViewParams,
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
                customViewParams: ICustomView;
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
                        TableNodeSourceEnum.Custom
                    ),
                    data.name,
                    data.customViewParams
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
                customViewParams: ICustomView;
            }[]
        >('custom-views', []);

        if (customViewData.length === 0) {
            return;
        }

        const filteredCustomViews = customViewData.filter(
            (customView) =>
                !(
                    customView.name === node.name &&
                    customView.dbId === node.dbId &&
                    customView.tableName === node.tableName
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
