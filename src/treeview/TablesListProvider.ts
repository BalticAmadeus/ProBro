import * as vscode from 'vscode';
import { INode } from './INode';
import * as tableNode from './TableNode';
import { IConfig, TableCount } from '../view/app/model';
import { ProcessorFactory } from '../repo/processor/ProcessorFactory';
import { TableNode, TableNodeSourceEnum } from './TableNode';
import { PanelViewProvider } from '../webview/PanelViewProvider';
import {
    getAllColumnsCache,
    getSelectedColumnsCache,
    updateAllColumnsCache,
} from '../repo/utils/cache';
import { Constants } from '../common/Constants';
import { GroupListProvider } from './GroupListProvider';

export class TablesListProvider implements vscode.TreeDataProvider<INode> {
    public  node: TableNode | undefined;
    public  tableNodes: tableNode.TableNode[] = [];
    public  filters: string[] | undefined = ['UserTable'];
    public  tableClicked: TableCount = { tableName: undefined, count: 0 };
    public  groupList: GroupListProvider | undefined;

    constructor(
        public fieldsProvider: PanelViewProvider,
        public indexesProvider: PanelViewProvider,
        public context: vscode.ExtensionContext,
        public groupListProvider: GroupListProvider
    ) {
        this.context = context;
        this.groupList = groupListProvider;
    }

    public displayData(node: TableNode, useCache = true) {
        this.fieldsProvider.tableNode = node;
        this.indexesProvider.tableNode = node;
        if (useCache && node.cache) {
            this.fieldsProvider._view?.webview.postMessage({
                id: '1',
                command: 'data',
                data: node.cache,
            });
            this.indexesProvider._view?.webview.postMessage({
                id: '2',
                command: 'data',
                data: node.cache,
            });
        } else {
            return ProcessorFactory.getProcessorInstance()
                .getTableDetails(this.getLatestConfig(node.dbId), node.tableName)
                .then((oeTableDetails) => {
                    const previouslySelectedColumns = getSelectedColumnsCache(
                        this.node
                    );

                    const fieldNames = oeTableDetails.fields.map(
                        (field) => field.name
                    );

                    const cachedColumns = getAllColumnsCache(this.node);

                    const defaultDeselections = ['RECID', 'ROWID'];

                    const newFields = fieldNames
                        .filter(
                            (fieldName) => !cachedColumns.includes(fieldName)
                        )
                        .filter(
                            (fieldName) =>
                                !defaultDeselections.includes(fieldName)
                        );

                    // If there is no previously selected columns, select all by default, except RECID, ROWID
                    if (!previouslySelectedColumns) {
                        oeTableDetails.selectedColumns = newFields;
                    } else {
                        // Selected columns are previously selected ones plus the new columns
                        oeTableDetails.selectedColumns = [
                            ...previouslySelectedColumns,
                            ...newFields,
                        ];
                    }

                    node.cache = oeTableDetails;

                    updateAllColumnsCache(this.node, fieldNames);

                    this.fieldsProvider._view?.webview.postMessage({
                        id: '3',
                        command: 'data',
                        data: oeTableDetails,
                    });
                    this.indexesProvider._view?.webview.postMessage({
                        id: '4',
                        command: 'data',
                        data: oeTableDetails,
                    });
                })
                .catch((err) => {
                    vscode.window.showErrorMessage(err);
                    this.fieldsProvider._view?.webview.postMessage({
                        id: '5',
                        command: 'data',
                        data: null,
                    });
                    this.indexesProvider._view?.webview.postMessage({
                        id: '6',
                        command: 'data',
                        data: null,
                    });
                });
        }
    }

    onDidChangeSelection(e: vscode.TreeViewSelectionChangeEvent<INode>): void {
        if (e.selection.length) {
            if (e.selection[0] instanceof TableNode) {
                this.node = e.selection[0];
                this.displayData(this.node, false);
            }
        }
    }

    public _onDidChangeTreeData: vscode.EventEmitter<INode | undefined | void> =
        new vscode.EventEmitter<INode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<INode | undefined | void> =
        this._onDidChangeTreeData.event;

    resolveTreeItem(
        item: vscode.TreeItem
    ): vscode.ProviderResult<vscode.TreeItem> {
        const command: vscode.Command = {
            title: 'DblClickQuery',
            command: 'pro-bro.dblClickQuery',
        };
        item.command = command;
        return item;
    }

    public countClick() {
        if (this.tableClicked.tableName === this.node?.tableName) {
            this.tableClicked.count = this.tableClicked.count + 1;
        } else {
            this.tableClicked = { tableName: this.node?.tableName, count: 1 };
        }

        setTimeout(() => {
            this.tableClicked = { tableName: undefined, count: 0 };
        }, 500);
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public refreshList(filters: string[] | undefined): void {
        this.filters = filters;
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(
        element: INode
    ): Promise<vscode.TreeItem> | vscode.TreeItem {
        return element.getTreeItem();
    }

    public getChildren(element?: INode): Thenable<INode[]> | INode[] {
        if (!element) {
            console.log('Load up the tree!');
            return this.getFilteredTables();
        }
        return element.getChildren();
    }

    private async getGroupNode(): Promise<void> {
        this.tableNodes = [];
        const configsToLoad = this.groupList?.getSelectedConfigs() ?? [];

        for (const config of configsToLoad) {
            await ProcessorFactory.getProcessorInstance()
                .getTablesList(config)
                .then((oeTables) => {
                    if (oeTables instanceof Error) {
                        return;
                    }

                    if (oeTables.error) {
                        vscode.window.showErrorMessage(
                            `Error connecting DB: ${oeTables.description} (${oeTables.error})`
                        );
                        return;
                    }

                    console.log(`Requested tables list of DB: ${config.name}`);
                    const connectionLabel = config.label;
                    const connectionName = config.name;
                    oeTables.tables.forEach(
                        (table: { name: string; tableType: string }) => {
                            this.tableNodes?.push(
                                new tableNode.TableNode(
                                    Constants.context,
                                    config.id,
                                    table.name,
                                    table.tableType,
                                    connectionName,
                                    connectionLabel,
                                    TableNodeSourceEnum.Tables
                                )
                            );
                        }
                    );
                });
        }
    }

    public async getFilteredTables(): Promise<tableNode.TableNode[]> {
        await this.getGroupNode();

        return this.tableNodes.filter((table) => {
            return this.filters?.includes(table.tableType);
        });
    }

    public getLatestConfig(groupId: string): IConfig | undefined {
        return this.groupList?.getConfigByGroup(groupId);
    }
}
