import * as vscode from 'vscode';
import * as path from 'path';
import { QuickPickItem } from 'vscode';
import { ConnectionEditor } from './webview/ConnectionEditor';
import { Constants } from './common/Constants';
import { QueryEditor } from './webview/QueryEditor';
import { DbConnectionNode } from './treeview/DbConnectionNode';
import { FieldsViewProvider } from './webview/FieldsViewProvider';
import { IndexesViewProvider } from './webview/IndexesViewProvider';
import { GroupListProvider } from './treeview/GroupListProvider';
import { TableNode, TableNodeSourceEnum } from './treeview/TableNode';
import { TablesListProvider } from './treeview/TablesListProvider';
import { DbConnectionUpdater } from './treeview/DbConnectionUpdater';
import { IPort, IConfig } from './view/app/model';
import {
    readFile,
    getOEVersion,
    parseOEFile,
} from './common/OpenEdgeJsonReaded';
import {
    ImportedConnectionSources,
    getProjectConnectionIdPrefix,
    loadImportedProjects,
    migrateSavedItems,
    reconcileImportedProjectConnections,
} from './common/ImportedProjectConnections';
import { withSavedItemsLock } from './common/SavedItems';

import { VersionChecker } from './view/app/Welcome/VersionChecker';
import { WelcomePageProvider } from './webview/WelcomePageProvider';
import { AblHoverProvider } from './providers/AblHoverProvider';
import { queryEditorCache } from './webview/queryEditor/queryEditorCache';
import { FavoritesProvider } from './treeview/FavoritesProvider';
import { CustomViewProvider } from './treeview/CustomViewProvider';
import { CustomViewNode } from './treeview/CustomViewNode';

export async function activate(context: vscode.ExtensionContext) {
    let extensionPort = 23456;
    Constants.context = context;

    const versionChecker = new VersionChecker(context);

    if (versionChecker.isNewVersion()) {
        new WelcomePageProvider(context, versionChecker.versionFromPackage);
    }

    const initialPorts = context.globalState.get<{
        [id: string]: IPort;
    }>(`${Constants.globalExtensionKey}.portList`);

    if (initialPorts === undefined) {
        context.globalState.update(`${Constants.globalExtensionKey}.portList`, {
            '23456': { port: 23456, isInUse: false, timestamp: undefined },
            '23457': { port: 23457, isInUse: false, timestamp: undefined },
            '23458': { port: 23458, isInUse: false, timestamp: undefined },
            '23459': { port: 23459, isInUse: false, timestamp: undefined },
        });
    }

    vscode.workspace.onDidChangeConfiguration((event) => {
        const affected = event.affectsConfiguration(
            `${Constants.globalExtensionKey}.possiblePortsList`,
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
                undefined,
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
                },
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
            newGlobalStatePortList,
        );
    });

    const updatePortList = () => {
        if (!extensionPort) {
            return;
        }
        const portList = context.globalState.get<{ [id: string]: IPort }>(
            `${Constants.globalExtensionKey}.portList`,
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
            portList,
        );
    };

    setInterval(updatePortList, 30000);

    const fieldsProvider = new FieldsViewProvider('fields');
    const fields = vscode.window.registerWebviewViewProvider(
        `${Constants.globalExtensionKey}-fields`,
        fieldsProvider,
        {},
    );
    context.subscriptions.push(fields);

    const indexesProvider = new IndexesViewProvider('indexes');
    const indexes = vscode.window.registerWebviewViewProvider(
        `${Constants.globalExtensionKey}-indexes`,
        indexesProvider,
        {},
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
                    'No openedge-project.json file found at the root.',
                );
                return null;
            }
        });

    function getOEJRuntime(uri: vscode.Uri) {
        try {
            return getOEVersion(readFile(uri.fsPath));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(
                `Unable to read OpenEdge runtime from ${uri.fsPath}: ${message}`,
            );
            return null;
        }
    }

    let defaultRuntime;
    if (Array.isArray(oeRuntimes) && oeRuntimes.length > 0) {
        defaultRuntime = oeRuntimes.some(
            (runtime) => runtime.name === oejRuntimeName,
        )
            ? oeRuntimes.find((runtime) => runtime.name === oejRuntimeName)
            : oeRuntimes.find(
                (runtime) => runtime.name === defaultRuntimeName,
            ) || oeRuntimes[0];
    } else {
        vscode.window.showWarningMessage(
            'No OpenEdge runtime configured on this machine.',
        );
        defaultRuntime = null;
    }

    if (defaultRuntime !== null) {
        Constants.dlc = defaultRuntime.path;
        vscode.window.showInformationMessage(
            `Runtime selected : ${defaultRuntime.name}, Path: ${defaultRuntime.path}`,
        );
    }

    let importConnections = vscode.workspace
        .getConfiguration(Constants.globalExtensionKey)
        .get('importConnections');

    await syncImportedConnections(false);

    const fileWatcher: vscode.FileSystemWatcher =
        vscode.workspace.createFileSystemWatcher('**/openedge-project.json');
    context.subscriptions.push(fileWatcher);
    fileWatcher.onDidChange(() => void syncImportedConnections());
    fileWatcher.onDidCreate(() => void syncImportedConnections());
    fileWatcher.onDidDelete(() => void syncImportedConnections());

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (
            event.affectsConfiguration(
                `${Constants.globalExtensionKey}.importConnections`,
            )
        ) {
            importConnections = vscode.workspace
                .getConfiguration(Constants.globalExtensionKey)
                .get('importConnections');
            void syncImportedConnections();
        }
    });

    /**
     * Replaces the imported connections with the ones from the openedge-project.json
     * files (or removes them when importing is disabled) and migrates saved items.
     */
    function syncImportedConnections(refresh = true): Promise<void> {
        const dbConfigKey = `${Constants.globalExtensionKey}.dbconfig`;
        const sourcesKey = `${Constants.globalExtensionKey}.importedConnectionSources`;

        return withSavedItemsLock(async () => {
            try {
                const importedSources =
                    context.workspaceState.get<ImportedConnectionSources>(sourcesKey);
                const connections = context.workspaceState.get<{
                    [id: string]: IConfig;
                }>(dbConfigKey, {});
                const files = importConnections
                    ? await vscode.workspace.findFiles('**/openedge-project.json')
                    : [];
                const projects = loadImportedProjects(
                    files.map((uri) => ({
                        source: uri.toString(),
                        workspaceFolderName:
                            vscode.workspace.getWorkspaceFolder(uri)?.name ??
                            path.basename(path.dirname(uri.fsPath)),
                        load: () => parseOEFile(readFile(uri.fsPath), uri.fsPath, {
                            idPrefix: getProjectConnectionIdPrefix(uri.toString()),
                        }),
                    })),
                    connections,
                    importedSources,
                    (source, error) => {
                        const message = error instanceof Error ? error.message : String(error);
                        vscode.window.showErrorMessage(
                            `Unable to import connections from ${source}: ${message}`,
                        );
                    },
                );

                await migrateSavedItems(
                    context.globalState, context.workspaceState, projects, importedSources,
                );
                const state = reconcileImportedProjectConnections(
                    connections, importedSources, projects,
                );
                await Promise.all([
                    context.workspaceState.update(dbConfigKey, state.connections),
                    context.workspaceState.update(sourcesKey, state.sources),
                ]);
                if (refresh) {
                    await vscode.commands.executeCommand(
                        `${Constants.globalExtensionKey}.refreshList`,
                    );
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(
                    `Unable to update imported OpenEdge project connections: ${message}`,
                );
            }
        });
    }

    const groupListProvider = new GroupListProvider(
        context
    );

    const tablesListProvider = new TablesListProvider(
        fieldsProvider,
        indexesProvider,
        context,
        groupListProvider
    );

    const favoritesProvider = new FavoritesProvider(
        fieldsProvider,
        indexesProvider,
        context,
        groupListProvider
    );

    const customViewsProvider = new CustomViewProvider(
        fieldsProvider,
        indexesProvider,
        context,
        groupListProvider
    );
    
    groupListProvider.setProviders(
        tablesListProvider,
        favoritesProvider,
        customViewsProvider
    );

    const customViews = vscode.window.createTreeView(
        `${Constants.globalExtensionKey}-custom-views`,
        { treeDataProvider: customViewsProvider },
    );
    customViews.onDidChangeSelection((e) =>
        customViewsProvider.onDidChangeSelection(e),
    );
    const favorites = vscode.window.createTreeView(
        `${Constants.globalExtensionKey}-favorites`,
        { treeDataProvider: favoritesProvider },
    );
    favorites.onDidChangeSelection((e) =>
        favoritesProvider.onDidChangeSelection(e),
    );

    const tables = vscode.window.createTreeView(
        `${Constants.globalExtensionKey}-tables`,
        { treeDataProvider: tablesListProvider },
    );
    tables.onDidChangeSelection((e) =>
        tablesListProvider.onDidChangeSelection(e),
    );
    fieldsProvider.tableListProvider = tablesListProvider;
    indexesProvider.tableListProvider = tablesListProvider;

    const groups = vscode.window.createTreeView(
        `${Constants.globalExtensionKey}-databases`,
        { treeDataProvider: groupListProvider, canSelectMany: true },
    );
    groups.onDidChangeSelection((e) =>
        groupListProvider.onDidChangeSelection(e),
    );

    const connectionUpdater = new DbConnectionUpdater();
    connectionUpdater.updateConnectionStatusesWithRefreshCallback(
        context,
        groupListProvider,
    );

    /**
     * Creates a new query editor or if already open, then reveals it from cache and refetch data
     */
    const loadQueryEditor = (node: TableNode, reloadFull = false): void => {
        const key = node.getFullName(true) ?? '';

        const cachedQueryEditor = queryEditorCache.getQueryEditor(key);

        if (cachedQueryEditor) {
            if (reloadFull) {
                cachedQueryEditor.resetParams();
            }
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
            fieldsProvider,
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

    const queryEditorDblClick = async (
        node: TableNode,
        reloadFull = false,
    ): Promise<void> => {
        let key;
        let cachedQueryEditor;
        let nodeList;

        switch (node.source) {
            case TableNodeSourceEnum.Tables:
                nodeList = tablesListProvider.tableNodes;
                break;
            case TableNodeSourceEnum.Favorites:
                nodeList = await favoritesProvider.getChildren(undefined);
                break;
            case TableNodeSourceEnum.Custom:
                nodeList = await customViewsProvider.getChildren(undefined);
                break;
            default:
                nodeList = tablesListProvider.tableNodes;
        }

        const targetFullName = node.getFullName(true);
        const newNode = nodeList.find(
            (correctNode) => correctNode.getFullName(true) === targetFullName,
        );

        if (newNode) {
            node = newNode;
            key = node.getFullName(true) ?? '';
            cachedQueryEditor = queryEditorCache.getQueryEditor(key);
        }

        if (!cachedQueryEditor) {
            switch (node.source) {
                case TableNodeSourceEnum.Tables:
                    tablesListProvider.displayData(node, false);
                    break;
                case TableNodeSourceEnum.Favorites:
                    favoritesProvider.displayData(node, false);
                    break;
                case TableNodeSourceEnum.Custom:
                    customViewsProvider.displayData(node, false);
                    break;
            }
        }

        loadQueryEditor(node, reloadFull);
    };

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.saveCustomView`,
            async (node: CustomViewNode) => {
                await customViewsProvider.saveCustomView(node);
                customViewsProvider.refresh();
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.removeCustomView`,
            async (node: CustomViewNode) => {
                await customViewsProvider.removeCustomViews(node);
                customViewsProvider.refresh();
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.addFavourite`,
            async (node: TableNode) => {
                await favoritesProvider.addTableToFavorites(node);
                favoritesProvider.refresh();
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.removeFavourite`,
            async (node: TableNode) => {
                await favoritesProvider.removeTableFromFavorites(node);
                favoritesProvider.refresh();
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.addEntry`,
            () => {
                new ConnectionEditor(context, 'Add New Connection');
            },
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.refreshList`,
            () => {
                groupListProvider.refreshDependentViews();
                connectionUpdater.updateConnectionStatusesWithRefreshCallback(
                    context,
                    groupListProvider,
                );
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.query`,
            (node: TableNode) => {
                loadQueryEditor(node, true);
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.queryFavorite`,
            (node: TableNode) => {
                loadQueryEditor(node, true);
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.queryCustomView`,
            (node: CustomViewNode) => {
                loadQueryEditor(node);
                loadCustomView(node);
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.queryFromCode`,
            () => {
                if (tablesListProvider.node === undefined) {
                    return;
                }

                loadQueryEditor(tablesListProvider.node);
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.deleteConnection`,
            async (dbConnectionNode: DbConnectionNode) => {
                const confirmation = await vscode.window.showWarningMessage(
                    `Are you sure you want to delete the connection "${dbConnectionNode.config.label}"?`,
                    { modal: true },
                    'Yes',
                    'No',
                );

                if (confirmation === 'Yes') {
                    dbConnectionNode.deleteConnection(context);
                }
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.refreshConnection`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.refreshConnection(context);
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.editConnection`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.editConnection(context);
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.procedureEditor`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.runScript(context, 'procedureEditor');
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.dataAdministration`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.runScript(context, 'dataAdministration');
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${Constants.globalExtensionKey}.dataDictionary`,
            (dbConnectionNode: DbConnectionNode) => {
                dbConnectionNode.runScript(context, 'dataDictionary');
            },
        ),
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.list-filter`,
        async () => {
            const options: QuickPickItem[] = [
                ...new Set([
                    ...tablesListProvider.tableNodes.map(
                        (table) => table.tableType,
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
                    (option) => option.picked,
                );
            }

            quickPick.onDidChangeSelection(async (selection) => {
                const filters = selection.map((type) => type.label);
                tablesListProvider.refreshList(filters);
            });

            quickPick.onDidHide(() => quickPick.dispose());
            quickPick.show();
        },
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.dblClickCustomViewQuery`,
        () => {
            if (customViewsProvider.node === undefined) {
                return;
            }

            customViewsProvider.countClick();
            if (customViewsProvider.tableClicked.count === 2) {
                queryEditorDblClick(customViewsProvider.node);
                loadCustomView(customViewsProvider.node);
            }
        },
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.dblClickFavoriteQuery`,
        () => {
            if (favoritesProvider.node === undefined) {
                return;
            }

            favoritesProvider.countClick();
            if (favoritesProvider.tableClicked.count === 2) {
                queryEditorDblClick(favoritesProvider.node, true);
            }
        },
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.dblClickQuery`,
        () => {
            if (tablesListProvider.node === undefined) {
                return;
            }

            tablesListProvider.countClick();
            if (tablesListProvider.tableClicked.count === 2) {
                queryEditorDblClick(tablesListProvider.node, true);
            }
        },
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.getPort`,
        async (): Promise<number | undefined> => {
            const portList = context.globalState.get<{ [id: string]: IPort }>(
                `${Constants.globalExtensionKey}.portList`,
            );
            if (!portList) {
                await vscode.window
                    .showErrorMessage(
                        'No port provided for connection. Provide port and restart. You can use default port number.',
                        'default',
                        'settings',
                    )
                    .then((selection) => {
                        if (selection === 'default') {
                            extensionPort = 23456;
                        } else if (selection === 'settings') {
                            vscode.commands.executeCommand(
                                'workbench.action.openSettings',
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
                            portList,
                        );
                        break;
                    }
                }
            }
            return extensionPort;
        },
    );

    vscode.commands.registerCommand(
        `${Constants.globalExtensionKey}.releasePort`,
        () => {
            const portList = context.globalState.get<{ [id: string]: IPort }>(
                `${Constants.globalExtensionKey}.portList`,
            );

            if (!portList) {
                return;
            }

            for (const id of Object.keys(portList)) {
                const port = portList[id];
                const timestamp = port.timestamp;
                if (
                    port.isInUse &&
                    timestamp !== undefined &&
                    Date.now() - timestamp > 35000
                ) {
                    portList[id].isInUse = false;
                    portList[id].timestamp = undefined;
                    context.globalState.update(
                        `${Constants.globalExtensionKey}.portList`,
                        portList,
                    );
                }
            }
        },
    );

    const hoverProvider = new AblHoverProvider(tablesListProvider);
    vscode.languages.registerHoverProvider('abl', hoverProvider);
}
