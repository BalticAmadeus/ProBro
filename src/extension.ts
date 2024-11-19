import * as vscode from 'vscode';
import { QuickPickItem } from 'vscode';
import { ConnectionEditor } from './webview/ConnectionEditor';
import { Constants } from './common/Constants';
import { QueryEditor } from './webview/QueryEditor';
import { DbConnectionNode } from './treeview/DbConnectionNode';
import { FieldsViewProvider } from './webview/FieldsViewProvider';
import { IndexesViewProvider } from './webview/IndexesViewProvider';
import { GroupListProvider } from './treeview/GroupListProvider';
import { TableNode } from './treeview/TableNode';
import { TablesListProvider } from './treeview/TablesListProvider';
import { DbConnectionUpdater } from './treeview/DbConnectionUpdater';
import { IPort, IConfig } from './view/app/model';
import {
    readFile,
    getOEVersion,
    parseOEFile,
} from './common/OpenEdgeJsonReaded';

import { VersionChecker } from './view/app/Welcome/VersionChecker';
import { WelcomePageProvider } from './webview/WelcomePageProvider';
import { AblHoverProvider } from './providers/AblHoverProvider';
import { queryEditorCache } from './webview/queryEditor/queryEditorCache';
import { FavoritesProvider } from './treeview/FavoritesProvider';
import { CustomViewProvider } from './treeview/CustomViewProvider';
import { CustomViewNode } from './treeview/CustomViewNode';

export async function activate(context: vscode.ExtensionContext) {
    let extensionPort: number;
    Constants.context = context;

    const versionChecker = new VersionChecker(context);

    if (versionChecker.isNewVersion()) {
        new WelcomePageProvider(context, versionChecker.versionFromPackage);
    }

    let allFileContent = '';

    vscode.workspace.onDidChangeConfiguration((event) => {
        const affected = event.affectsConfiguration(
            `${Constants.globalExtensionKey}.possiblePortsList`
        );
        if (!affected) {
            return;
        }

        const settingsPorts: number[] =
            vscode.workspace
                .getConfiguration(Constants.globalExtensionKey)
                .get('possiblePortsList') ?? [];
        if (settingsPorts.length === 0) {
            context.globalState.update(
                `${Constants.globalExtensionKey}.portList`,
                undefined
            );
            return;
        }
        let newGlobalStatePortList: IPort[] = [];
        const globalStatePorts = context.globalState.get<{
            [id: string]: IPort;
        }>(`${Constants.globalExtensionKey}.portList`);
        if (globalStatePorts) {
            newGlobalStatePortList = Object.values(globalStatePorts).filter(
                (gPort) => {
                    const portIndex: number = settingsPorts.indexOf(gPort.port);
                    if (portIndex < 0) {
                        return false;
                    } else {
                        settingsPorts.splice(portIndex, 1);
                        return true;
                    }
                }
            );
        }

        newGlobalStatePortList = [
            ...newGlobalStatePortList,
            ...settingsPorts.map((sPort: number): IPort => {
                return { port: sPort, isInUse: false, timestamp: undefined };
            }),
        ];

        context.globalState.update(
            `${Constants.globalExtensionKey}.portList`,
            newGlobalStatePortList
        );
    });

    const updatePortList = () => {
        if (!extensionPort) {
            return;
        }
        const portList = context.globalState.get<{ [id: string]: IPort }>(
            `${Constants.globalExtensionKey}.portList`
        );
        if (!portList) {
            return;
        }
        for (const id of Object.keys(portList)) {
            if (portList[id].port === extensionPort) {
                portList[id].timestamp = Date.now();
                break;
            }
        }

        context.globalState.update(
            `${Constants.globalExtensionKey}.portList`,
            portList
        );
    };

    setInterval(updatePortList, 30000);

    const fieldsProvider = new FieldsViewProvider('fields');
    const fields = vscode.window.registerWebviewViewProvider(
        `${Constants.globalExtensionKey}-fields`,
        fieldsProvider,
        {}
    );
    context.subscriptions.push(fields);

    const indexesProvider = new IndexesViewProvider('indexes');
    const indexes = vscode.window.registerWebviewViewProvider(
        `${Constants.globalExtensionKey}-indexes`,
        indexesProvider,
        {}
    );
    context.subscriptions.push(indexes);

    const ablConfig = vscode.workspace.getConfiguration('abl.configuration');
    const defaultRuntimeName = ablConfig.get<string>('defaultRuntime');
    const oeRuntimes: Array<any> = ablConfig.get<Array<any>>('runtimes') ?? [];

    const oejRuntimeName = await vscode.workspace
        .findFiles('openedge-project.json')
        .then((files) => {
            if (files.length > 0) {
                return getOEJRuntime(files[0]);
            } else {
                vscode.window.showWarningMessage(
                    'No openedge-project.json file found at the root.'
                );
                return null;
            }
        });

    function getOEJRuntime(uri: vscode.Uri) {
        allFileContent = readFile(uri.path);
        const oeRuntime = getOEVersion(allFileContent);
        return oeRuntime;
    }

    let defaultRuntime;
    if (Array.isArray(oeRuntimes) && oeRuntimes.length > 0) {
        defaultRuntime = oeRuntimes.some(
            (runtime) => runtime.name === oejRuntimeName
        )
            ? oeRuntimes.find((runtime) => runtime.name === oejRuntimeName)
            : oeRuntimes.find(
                  (runtime) => runtime.name === defaultRuntimeName
              ) || oeRuntimes[0];
    } else {
        vscode.window.showWarningMessage(
            'No OpenEdge runtime configured on this machine.'
        );
        defaultRuntime = null;
    }

    if (defaultRuntime !== null) {
        Constants.dlc = defaultRuntime.path;
        vscode.window.showInformationMessage(
            `Runtime selected : ${defaultRuntime.name}, Path: ${defaultRuntime.path}`
        );
    }

    let importConnections = vscode.workspace
        .getConfiguration(Constants.globalExtensionKey)
        .get('importConnections');

    if (importConnections) {
        vscode.workspace.findFiles('**/openedge-project.json').then((list) => {
            list.forEach((uri) => createJsonDatabases(uri));
        });
    } else {
        clearDatabaseConfigState();
    }

    const fileWatcher: vscode.FileSystemWatcher =
        vscode.workspace.createFileSystemWatcher('**/openedge-project.json');
    fileWatcher.onDidChange((uri) => {
        if (importConnections) {
            createJsonDatabases(uri);
        } else {
            clearDatabaseConfigState();
        }
    });

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (
            event.affectsConfiguration(
                `${Constants.globalExtensionKey}.importConnections`
            )
        ) {
            importConnections = vscode.workspace
                .getConfiguration(Constants.globalExtensionKey)
                .get('importConnections');
            if (importConnections) {
                vscode.workspace
                    .findFiles('**/openedge-project.json')
                    .then((list) => {
                        list.forEach((uri) => createJsonDatabases(uri));
                    });
            } else {
                clearDatabaseConfigState();
            }
        }
    });

    function createJsonDatabases(uri: vscode.Uri) {
        allFileContent = readFile(uri.path);

        const configs = parseOEFile(allFileContent, uri.path);

        let connections = context.workspaceState.get<{ [id: string]: IConfig }>(
            `${Constants.globalExtensionKey}.dbconfig`
        );
        connections = {};

        configs.forEach((config) => {
            if (!connections) {
                connections = {};
            }
            connections[config.id] = config;
            context.workspaceState.update(
                `${Constants.globalExtensionKey}.dbconfig`,
                connections
            );
            vscode.window.showInformationMessage(
                'Connection saved succesfully.'
            );
            vscode.commands.executeCommand(
                `${Constants.globalExtensionKey}.refreshList`
            );
        });
    }

    function clearDatabaseConfigState() {
        context.workspaceState.update(
            `${Constants.globalExtensionKey}.dbconfig`,
            {}
        );
        vscode.commands.executeCommand(
            `${Constants.globalExtensionKey}.refreshList`
        );
    }

    const tablesListProvider = new TablesListProvider(
        fieldsProvider,
        indexesProvider,
        context
    );

    const favoritesProvider = new FavoritesProvider(
        fieldsProvider,
        indexesProvider,
        context
    );

    const customViewsProvider = new CustomViewProvider(
        fieldsProvider,
        indexesProvider,
        context
    );

    const customViews = vscode.window.createTreeView(
        `${Constants.globalExtensionKey}-custom-views`,
        { treeDataProvider: customViewsProvider }
    );
    customViews.onDidChangeSelection((e) =>
        customViewsProvider.onDidChangeSelection(e)
    );
    const favorites = vscode.window.createTreeView(
        `${Constants.globalExtensionKey}-favorites`,
        { treeDataProvider: favoritesProvider }
    );
    favorites.onDidChangeSelection((e) =>
        favoritesProvider.onDidChangeSelection(e)
    );

    const tables = vscode.window.createTreeView(
        `${Constants.globalExtensionKey}-tables`,
        { treeDataProvider: tablesListProvider }
    );
    tables.onDidChangeSelection((e) =>
        tablesListProvider.onDidChangeSelection(e)
    );
    fieldsProvider.tableListProvider = tablesListProvider;
    indexesProvider.tableListProvider = tablesListProvider;

    const groupListProvider = new GroupListProvider(context, tables);
    const groups = vscode.window.createTreeView(
        `${Constants.globalExtensionKey}-databases`,
        { treeDataProvider: groupListProvider, canSelectMany: true }
    );

    const connectionUpdater = new DbConnectionUpdater();
    connectionUpdater.updateConnectionStatusesWithRefreshCallback(
        context,
        groupListProvider
    );

    groups.onDidChangeSelection((e) =>
        groupListProvider.onDidChangeSelection(
            e,
            tablesListProvider,
            favoritesProvider,
            customViewsProvider
        )
    );

    /**
     * Creates a new query editor or if already open, then reveals it from cache and refetch data
     */
    const loadQueryEditor = (node: TableNode): void => {
        const key = node.getFullName(true) ?? '';

        const cachedQueryEditor = queryEditorCache.getQueryEditor(key);

        if (cachedQueryEditor) {
            cachedQueryEditor.panel?.reveal();
            cachedQueryEditor.refetchData();
            return;
        }

        const newQueryEditor = new QueryEditor(
            context,
            node,
            tablesListProvider,
            favoritesProvider,
            customViewsProvider,
            fieldsProvider
        );

        queryEditorCache.setQueryEditor(key, newQueryEditor);
    };

    const loadCustomView = (node: CustomViewNode): void => {
        const key = node.getFullName(true) ?? '';
        const cachedQueryEditor = queryEditorCache.getQueryEditor(key);

        if (cachedQueryEditor) {
            cachedQueryEditor.setParams(node);
        }
    };

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.saveCustomView`,
            (node: CustomViewNode) => {
                customViewsProvider.saveCustomView(node);
                customViewsProvider.refresh(undefined);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.removeCustomView`,
            (node: CustomViewNode) => {
                customViewsProvider.removeCustomViews(node);
                customViewsProvider.refresh(undefined);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.addFavourite`,
            (node: TableNode) => {
                favoritesProvider.addTableToFavorites(node);
                favoritesProvider.refresh(undefined);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.removeFavourite`,
            (node: TableNode) => {
                favoritesProvider.removeTableFromFavorites(node);
                favoritesProvider.refresh(undefined);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.addEntry`,
            () => {
                new ConnectionEditor(context, 'Add New Connection');
            }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.refreshList`,
            () => {
                connectionUpdater.updateConnectionStatusesWithRefreshCallback(
                    context,
                    groupListProvider
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.query`,
            (node: TableNode) => {
                tablesListProvider.selectDbConfig(node);
                loadQueryEditor(node);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.queryFavorite`,
            (node: TableNode) => {
                favoritesProvider.selectDbConfig(node);
                loadQueryEditor(node);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.queryCustomView`,
            (node: CustomViewNode) => {
                customViewsProvider.selectDbConfig(node);
                loadQueryEditor(node);
                loadCustomView(node);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.queryFromCode`,
            () => {
                if (tablesListProvider.node === undefined) {
                    return;
                }

                loadQueryEditor(tablesListProvider.node);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.deleteConnection`,
            async (dbConnectionNode: DbConnectionNode) => {
                const confirmation = await vscode.window.showWarningMessage(
                    `Are you sure you want to delete the connection "${dbConnectionNode.config.label}"?`,
                    { modal: true },
                    'Yes',
                    'No'
                );

                if (confirmation === 'Yes') {
                    dbConnectionNode.deleteConnection(context);
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.refreshConnection`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.refreshConnection(context);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.editConnection`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.editConnection(context);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.procedureEditor`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.runScript(context, 'procedureEditor');
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.dataAdministration`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.runScript(context, 'dataAdministration');
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.dataDictionary`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.runScript(context, 'dataDictionary');
            }
        )
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.list-filter`,
        async () => {
            const options: QuickPickItem[] = [
                ...new Set([
                    ...tablesListProvider.tableNodes.map(
                        (table) => table.tableType
                    ),
                ]),
            ].map((label) => ({ label }));
            options.forEach((option) => {
                if (tablesListProvider.filters?.includes(option.label)) {
                    option.picked = true;
                }
            });
            const quickPick = vscode.window.createQuickPick();
            quickPick.items = options;
            quickPick.canSelectMany = true;
            quickPick.onDidAccept(() => quickPick.dispose());

            if (tablesListProvider.filters) {
                quickPick.selectedItems = options.filter(
                    (option) => option.picked
                );
            }

            quickPick.onDidChangeSelection(async (selection) => {
                const filters = selection.map((type) => type.label);
                tablesListProvider.refreshList(filters);
            });

            quickPick.onDidHide(() => quickPick.dispose());
            quickPick.show();
        }
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.dblClickFavoriteQuery`,
        () => {
            if (favoritesProvider.node === undefined) {
                return;
            }

            favoritesProvider.countClick();
            if (favoritesProvider.tableClicked.count === 2) {
                loadQueryEditor(favoritesProvider.node);
            }
        }
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.dblClickQuery`,
        () => {
            if (tablesListProvider.node === undefined) {
                return;
            }

            tablesListProvider.countClick();
            if (tablesListProvider.tableClicked.count === 2) {
                loadQueryEditor(tablesListProvider.node);
            }
        }
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.getPort`,
        async (): Promise<number | undefined> => {
            const portList = context.globalState.get<{ [id: string]: IPort }>(
                `${Constants.globalExtensionKey}.portList`
            );
            if (!portList) {
                await vscode.window
                    .showErrorMessage(
                        'No port provided for connection. Provide port and restart. You can use default port number.',
                        'default',
                        'settings'
                    )
                    .then((selection) => {
                        if (selection === 'default') {
                            extensionPort = 23456;
                        } else if (selection === 'settings') {
                            vscode.commands.executeCommand(
                                'workbench.action.openSettings'
                            );
                        }
                    });
            } else {
                for (const id of Object.keys(portList)) {
                    if (!portList[id].isInUse) {
                        extensionPort = portList[id].port;
                        portList[id].isInUse = true;
                        portList[id].timestamp = Date.now();
                        context.globalState.update(
                            `${Constants.globalExtensionKey}.portList`,
                            portList
                        );
                        break;
                    }
                }
            }
            return extensionPort;
        }
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.releasePort`,
        () => {
            const portList = context.globalState.get<{ [id: string]: IPort }>(
                `${Constants.globalExtensionKey}.portList`
            );

            if (!portList) {
                return;
            }

            for (const id of Object.keys(portList)) {
                const port = portList[id];
                const timestamp = port.timestamp;
                if (
                    port.isInUse &&
                    timestamp &&
                    Date.now() - timestamp > 35000
                ) {
                    portList[id].isInUse = false;
                    portList[id].timestamp = undefined;
                    createJsonDatabases;
                    context.globalState.update(
                        `${Constants.globalExtensionKey}.portList`,
                        portList
                    );
                }
            }
        }
    );

    const hoverProvider = new AblHoverProvider(tablesListProvider);
    vscode.languages.registerHoverProvider('abl', hoverProvider);
}
