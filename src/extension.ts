import * as vscode from "vscode";
import { QuickPickItem } from "vscode";
import { ConnectionEditor } from "./webview/ConnectionEditor";
import { Constants } from "./common/Constants";
import { QueryEditor } from "./webview/QueryEditor";
import { DbConnectionNode } from "./treeview/DbConnectionNode";
import { FieldsViewProvider } from "./webview/FieldsViewProvider";
import { IndexesViewProvider } from "./webview/IndexesViewProvider";
import { GroupListProvider } from "./treeview/GroupListProvider";
import { TableNode } from "./treeview/TableNode";
import { TablesListProvider } from "./treeview/TablesListProvider";
import { DbConnectionUpdater } from "./treeview/DbConnectionUpdater";
import { IPort, IConfig } from "./view/app/model";
import { readFile, parseOEFile } from "./common/OpenEdgeJsonReaded";

import { VersionChecker } from "./view/app/Welcome/VersionChecker";
import { WelcomePageProvider } from "./webview/WelcomePageProvider";

export function activate(context: vscode.ExtensionContext) {
  let extensionPort: number;
  Constants.context = context;

  const versionChecker = new VersionChecker(context);

  if (versionChecker.isNewVersion()) {
    new WelcomePageProvider(context, versionChecker.versionFromPackage);
  }

  let allFileContent: string = "";

  vscode.workspace.onDidChangeConfiguration((event) => {
    const affected = event.affectsConfiguration("ProBro.possiblePortsList");
    if (!affected) {
      return;
    }

    const settingsPorts: number[] = vscode.workspace
      .getConfiguration("ProBro")
      .get("possiblePortsList")!;
    if (settingsPorts.length === 0) {
      context.globalState.update(
        `${Constants.globalExtensionKey}.portList`,
        undefined
      );
      return;
    }
    let newGlobalStatePortList: IPort[] = [];
    const globalStatePorts = context.globalState.get<{ [id: string]: IPort }>(
      `${Constants.globalExtensionKey}.portList`
    )!;
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

  const fieldsProvider = new FieldsViewProvider(context, "fields");
  const fields = vscode.window.registerWebviewViewProvider(
    `${Constants.globalExtensionKey}-fields`,
    fieldsProvider,
    {}
  );
  context.subscriptions.push(fields);

  const indexesProvider = new IndexesViewProvider(context, "indexes");
  const indexes = vscode.window.registerWebviewViewProvider(
    `${Constants.globalExtensionKey}-indexes`,
    indexesProvider,
    {}
  );
  context.subscriptions.push(indexes);

  let oeRuntimes: Array<any>;

  oeRuntimes = vscode.workspace
    .getConfiguration("abl.configuration")
    .get<Array<any>>("runtimes")!;
  if (oeRuntimes.length === 0) {
    vscode.window.showWarningMessage(
      "No OpenEdge runtime configured on this machine"
    );
  }

  const defaultRuntime =
    oeRuntimes.length === 1
      ? oeRuntimes[0]
      : oeRuntimes.find((runtime) => runtime.default);
  if (defaultRuntime !== undefined) {
    Constants.dlc = defaultRuntime.path;
  }

  let importConnections = vscode.workspace
    .getConfiguration("ProBro")
    .get("importConnections");
  let fileWatcher: vscode.FileSystemWatcher;

  if (importConnections) {
    vscode.workspace.findFiles("**/openedge-project.json").then((list) => {
      list.forEach((uri) => createJsonDatabases(uri));
    });
  } else {
    clearDatabaseConfigState();
  }

  fileWatcher = vscode.workspace.createFileSystemWatcher(
    "**/openedge-project.json"
  );
  fileWatcher.onDidChange((uri) => {
    if (importConnections) {
      createJsonDatabases(uri);
    } else {
      clearDatabaseConfigState();
    }
  });

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("ProBro.importConnections")) {
      importConnections = vscode.workspace
        .getConfiguration("ProBro")
        .get("importConnections");
      if (importConnections) {
        vscode.workspace.findFiles("**/openedge-project.json").then((list) => {
          list.forEach((uri) => createJsonDatabases(uri));
        });
      } else {
        clearDatabaseConfigState();
      }
    }
  });

  function createJsonDatabases(uri: vscode.Uri) {
    allFileContent = readFile(uri.path);

    const configs = parseOEFile(allFileContent);

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
      vscode.window.showInformationMessage("Connection saved succesfully.");
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
    context,
    fieldsProvider,
    indexesProvider
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
    groupListProvider.onDidChangeSelection(e, tablesListProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${Constants.globalExtensionKey}.addEntry`,
      () => {
        new ConnectionEditor(context, "Add New Connection");
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
        tables.onDidChangeSelection((e) =>
          tablesListProvider.onDidChangeSelection(e)
        );
        new QueryEditor(context, node, tablesListProvider, fieldsProvider);
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
          "Yes",
          "No"
        );

        if (confirmation === "Yes") {
          dbConnectionNode.deleteConnection(context);
        }
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
        dbConnectionNode.runScript(context, "procedureEditor");
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${Constants.globalExtensionKey}.dataAdministration`,
      (dbConnectionNode: DbConnectionNode) => {
        dbConnectionNode.runScript(context, "dataAdministration");
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${Constants.globalExtensionKey}.dataDictionary`,
      (dbConnectionNode: DbConnectionNode) => {
        dbConnectionNode.runScript(context, "dataDictionary");
      }
    )
  );

  vscode.commands.registerCommand(
    `${Constants.globalExtensionKey}.list-filter`,
    async () => {
      const options: QuickPickItem[] = [
        ...new Set([
          ...tablesListProvider.tableNodes.map((table) => table.tableType),
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
        quickPick.selectedItems = options.filter((option) => option.picked);
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
    `${Constants.globalExtensionKey}.dblClickQuery`,
    (_) => {
      tablesListProvider.countClick();
      if (tablesListProvider.tableClicked.count === 2) {
        new QueryEditor(
          context,
          tablesListProvider.node as TableNode,
          tablesListProvider,
          fieldsProvider
        );
      }
    }
  );

  vscode.commands.registerCommand(
    `${Constants.globalExtensionKey}.getPort`,
    async (): Promise<number | undefined> => {
      const portList = context.globalState.get<{ [id: string]: IPort }>(
        `${Constants.globalExtensionKey}.portList`
      )!;
      if (!portList) {
        await vscode.window
          .showErrorMessage(
            "No port provided for connection. Provide port and restart. You can use default port number.",
            "default",
            "settings"
          )
          .then((selection) => {
            if (selection === "default") {
              extensionPort = 23456;
            } else if (selection === "settings") {
              vscode.commands.executeCommand("workbench.action.openSettings");
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
        if (
          portList[id].isInUse &&
          Date.now() - portList[id].timestamp! > 35000
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
}
