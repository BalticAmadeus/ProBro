import path = require('path');
import * as vscode from 'vscode';
import { ICommand, CommandAction, IConfig } from '../view/app/model';
import { IOETableData } from '../db/Oe';
import { TableNode } from '../treeview/TableNode';
import { TablesListProvider } from '../treeview/TablesListProvider';
import { FieldsViewProvider } from './FieldsViewProvider';
import { DumpFileFormatter } from './DumpFileFormatter';
import { Logger } from '../common/Logger';
import { ProcessorFactory } from '../repo/processor/ProcessorFactory';
import { Constants } from '../common/Constants';
import { queryEditorCache } from './queryEditor/queryEditorCache';
import { FavoritesProvider } from '../treeview/FavoritesProvider';

export class QueryEditor {
    public readonly panel: vscode.WebviewPanel | undefined;
    private readonly extensionPath: string;
    private disposables: vscode.Disposable[] = [];
    public tableName: string;
    private fieldsProvider: FieldsViewProvider;
    private readonly configuration = vscode.workspace.getConfiguration(
        Constants.globalExtensionKey
    );
    private readOnly = false;
    private logger = new Logger(this.configuration.get('logging.node')!);

    constructor(
        private context: vscode.ExtensionContext,
        private tableNode: TableNode,
        private tableListProvider: TablesListProvider,
        private favoritesProvider: FavoritesProvider,
        private fieldProvider: FieldsViewProvider
    ) {
        this.extensionPath = context.asAbsolutePath('');
        this.tableName = tableNode.tableName;
        this.fieldsProvider = fieldProvider;

        let config: IConfig | undefined;
        switch (this.tableNode.source) {
            case 'tables':
                config = this.tableListProvider.config;
                break;
            case 'favorites':
                config = this.favoritesProvider.config;
                break;
            default:
                return;
        }

        if (config) {
            this.readOnly = config?.isReadOnly;
        }

        this.panel = vscode.window.createWebviewPanel(
            'queryOETable', // Identifies the type of the webview. Used internally
            `${config?.label}.${this.tableNode.tableName}`, // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(
                        path.join(context.asAbsolutePath(''), 'out')
                    ),
                ],
            }
        );

        this.panel.iconPath = {
            dark: vscode.Uri.file(
                path.join(
                    this.extensionPath,
                    'resources',
                    'icon',
                    'query-icon-dark.svg'
                )
            ),
            light: vscode.Uri.file(
                path.join(
                    this.extensionPath,
                    'resources',
                    'icon',
                    'query-icon-light.svg'
                )
            ),
        };

        if (this.panel) {
            this.panel.webview.html = this.getWebviewContent({
                columns: [],
                data: [],
            });
        }

        this.panel.webview.onDidReceiveMessage(
            (command: ICommand) => {
                this.logger.log('command:', command);
                switch (command.action) {
                    case CommandAction.Query:
                        if (config) {
                            ProcessorFactory.getProcessorInstance()
                                .getTableData(
                                    config,
                                    this.tableNode.tableName,
                                    command.params
                                )
                                .then((oe) => {
                                    if (this.panel) {
                                        const obj = {
                                            id: command.id,
                                            command: 'data',
                                            columns:
                                                tableNode.cache
                                                    ?.selectedColumns,
                                            data: oe,
                                        };
                                        this.logger.log('data:', obj);
                                        this.panel?.webview.postMessage(obj);
                                    }
                                });
                        }
                        break;
                    case CommandAction.CRUD:
                        if (config) {
                            ProcessorFactory.getProcessorInstance()
                                .getTableData(
                                    config,
                                    this.tableNode.tableName,
                                    command.params
                                )
                                .then((oe) => {
                                    if (this.panel) {
                                        const obj = {
                                            id: command.id,
                                            command: 'crud',
                                            data: oe,
                                        };
                                        this.logger.log('data:', obj);
                                        this.panel?.webview.postMessage(obj);
                                    }
                                });
                        }
                        break;
                    case CommandAction.Submit:
                        if (config) {
                            ProcessorFactory.getProcessorInstance()
                                .submitTableData(
                                    config,
                                    this.tableNode.tableName,
                                    command.params
                                )
                                .then((oe) => {
                                    if (this.panel) {
                                        const obj = {
                                            id: command.id,
                                            command: 'submit',
                                            data: oe,
                                        };
                                        this.logger.log('data:', obj);
                                        if (
                                            obj.data.description !== null &&
                                            obj.data.description !== undefined
                                        ) {
                                            if (obj.data.description === '') {
                                                vscode.window.showErrorMessage(
                                                    'Database Error: Trigger canceled action'
                                                );
                                            } else {
                                                vscode.window.showErrorMessage(
                                                    'Database Error: ' +
                                                        obj.data.description
                                                );
                                            }
                                        } else {
                                            vscode.window.showInformationMessage(
                                                'Action was successful'
                                            );
                                        }
                                        this.panel?.webview.postMessage(obj);
                                    }
                                });
                        }
                        break;
                    case CommandAction.Export:
                        if (config) {
                            ProcessorFactory.getProcessorInstance()
                                .getTableData(
                                    config,
                                    this.tableNode.tableName,
                                    command.params
                                )
                                .then((oe) => {
                                    if (this.panel) {
                                        let exportData = oe;
                                        if (
                                            command.params?.exportType ===
                                            'dumpFile'
                                        ) {
                                            const dumpFileFormatter =
                                                new DumpFileFormatter();
                                            dumpFileFormatter.formatDumpFile(
                                                oe,
                                                this.tableNode.tableName,
                                                config!.label
                                            );
                                            exportData =
                                                dumpFileFormatter.getDumpFile();
                                        }
                                        const obj = {
                                            id: command.id,
                                            command: 'export',
                                            tableName: this.tableNode.tableName,
                                            data: exportData,
                                            format: command.params!.exportType,
                                        };
                                        this.logger.log('data:', obj);
                                        this.panel?.webview.postMessage(obj);
                                    }
                                });
                        }
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        this.fieldsProvider.addQueryEditor(this);

        this.panel.onDidDispose(
            () => {
                queryEditorCache.removeQueryEditor(
                    this.tableNode?.getFullName(true)
                );
                // When the panel is closed, cancel any future updates to the webview content
                this.fieldsProvider.removeQueryEditor(this);
            },
            null,
            context.subscriptions
        );
    }

    public refetchData = (): void => {
        const obj = {
            command: 'refetch',
        };
        this.logger.log('refetch:', obj);
        this.panel?.webview.postMessage(obj);
    };

    public updateFields() {
        const obj = {
            command: 'columns',
            columns: this.tableNode.cache?.selectedColumns,
        };
        this.logger.log('updateFields:', obj);
        this.panel?.webview.postMessage(obj);
    }

    private getWebviewContent(tableData: IOETableData): string {
        // Local path to main script run in the webview
        const reactAppPathOnDisk = vscode.Uri.file(
            path.join(
                vscode.Uri.file(
                    this.context.asAbsolutePath(
                        path.join('out/view/app', 'query.js')
                    )
                ).fsPath
            )
        );

        const reactAppUri =
            this.panel?.webview.asWebviewUri(reactAppPathOnDisk);
        const cspSource = this.panel?.webview.cspSource;

        return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Config View</title>
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none';
                      img-src https:;
                      script-src 'unsafe-eval' 'unsafe-inline' ${cspSource};
                      style-src ${cspSource} 'unsafe-inline';">

        <script>
          window.acquireVsCodeApi = acquireVsCodeApi;
          window.tableData = ${JSON.stringify(tableData)};
          window.tableName = ${JSON.stringify(this.tableNode.tableName)};
          window.configuration = ${JSON.stringify(this.configuration)};
          window.isReadOnly = ${JSON.stringify(this.readOnly)};
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
    }
}
