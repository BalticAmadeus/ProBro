import { CommandAction, ICommand, IConfig } from '@app/model';
import { Constants } from '@src/common/Constants';
import { Logger } from '@src/common/Logger';
import { ProcessorFactory } from '@src/repo/processor/ProcessorFactory';
import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import path = require('path');

export class ConnectionEditor {
    private readonly panel: vscode.WebviewPanel | undefined;
    private readonly extensionPath: string;
    private disposables: vscode.Disposable[] = [];
    private isTestedSuccesfully = false;
    private readonly id?: string;
    private readonly configuration = vscode.workspace.getConfiguration(
        Constants.globalExtensionKey
    );
    private logger = new Logger(
        this.configuration.get('logging.node') ?? false
    );

    constructor(
        private context: vscode.ExtensionContext,
        action: string,
        id?: string
    ) {
        this.extensionPath = context.asAbsolutePath('');
        this.context.globalState.get<{ [id: string]: IConfig }>(
            `${Constants.globalExtensionKey}.dbconfig`
        );
        if (id) {
            this.id = id;
        }

        this.panel = vscode.window.createWebviewPanel(
            'OEConnectionEditor', // Identifies the type of the webview. Used internally
            action, // Title of the panel displayed to the user
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
                    'connection-icon-dark.svg'
                )
            ),
            light: vscode.Uri.file(
                path.join(
                    this.extensionPath,
                    'resources',
                    'icon',
                    'connection-icon-light.svg'
                )
            ),
        };

        this.panel.webview.html = this.getWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            (command: ICommand) => {
                this.logger.log('command:', command);
                let connections = this.context.globalState.get<{
                    [id: string]: IConfig;
                }>(`${Constants.globalExtensionKey}.dbconfig`);
                switch (command.action) {
                    case CommandAction.Save:
                        if (!this.isTestedSuccesfully) {
                            vscode.window.showInformationMessage(
                                'Connection should be tested before saving.'
                            );
                            return;
                        } else if (!connections) {
                            connections = {};
                        } else if (command.content) {
                            connections[command.content.id] = command.content;
                            this.context.globalState.update(
                                `${Constants.globalExtensionKey}.dbconfig`,
                                connections
                            );
                            vscode.window.showInformationMessage(
                                'Connection saved succesfully.'
                            );
                            this.panel?.dispose();
                            vscode.commands.executeCommand(
                                `${Constants.globalExtensionKey}.refreshList`
                            );
                        }
                        return;
                    case CommandAction.Test:
                        if (command.content) {
                            ProcessorFactory.getProcessorInstance()
                                .getDBVersion(command.content)
                                .then((oe) => {
                                    if (oe.error) {
                                        vscode.window.showErrorMessage(
                                            `Error connecting DB: ${oe.description} (${oe.error})`
                                        );
                                    } else {
                                        this.logger.log(
                                            'Requested version of DB',
                                            oe.dbversion
                                        );
                                        vscode.window.showInformationMessage(
                                            'Connection OK'
                                        );
                                        this.isTestedSuccesfully = true;
                                    }
                                });
                        }
                        return;
                    case CommandAction.Group:
                        if (connections) {
                            const uniqueGroups = new Set<string>(); // Specify that the Set will contain strings

                            for (const id of Object.keys(connections)) {
                                const group =
                                    connections[id].group.toUpperCase();
                                uniqueGroups.add(group);
                            }

                            const groupNames: string[] =
                                Array.from(uniqueGroups);

                            this.groupList(groupNames);
                        }

                        return;
                }
            },
            undefined,
            context.subscriptions
        );

        this.panel.onDidDispose(
            () => {
                // When the panel is closed, cancel any future updates to the webview content
            },
            null,
            context.subscriptions
        );
    }

    private groupList(groupNames: string[]) {
        const obj = {
            command: 'group',
            columns: groupNames,
        };
        this.panel?.webview.postMessage(obj);
    }

    private getWebviewContent(): string {
        // Local path to main script run in the webview
        const reactAppPathOnDisk = vscode.Uri.file(
            path.join(
                vscode.Uri.file(
                    this.context.asAbsolutePath(
                        path.join('out/view/app', 'connection.js')
                    )
                ).fsPath
            )
        );

        const reactAppUri =
            this.panel?.webview.asWebviewUri(reactAppPathOnDisk);
        const cspSource = this.panel?.webview.cspSource;

        let config: IConfig = {
            id: uuid(),
            label: '',
            name: '',
            description: '',
            host: '',
            port: '',
            user: '',
            password: '',
            group: '',
            params: '',
            connectionId: 'LOCAL',
            type: 0,
            workState: false,
            isReadOnly: false,
        };
        if (this.id) {
            const connections = this.context.globalState.get<{
                [id: string]: IConfig;
            }>(`${Constants.globalExtensionKey}.dbconfig`);
            if (connections) {
                config = connections[this.id];
                if (!config) {
                    const workspaceConnections =
                        this.context.workspaceState.get<{
                            [id: string]: IConfig;
                        }>(`${Constants.globalExtensionKey}.dbconfig`);
                    if (workspaceConnections) {
                        config = workspaceConnections[this.id];
                        config.workState = true;
                    }
                }
            }
        }

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
          window.initialData = ${JSON.stringify(config)};
          window.configuration = ${JSON.stringify(this.configuration)};
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
    }
}
