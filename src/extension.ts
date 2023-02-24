import * as vscode from "vscode";
import { QuickPickItem } from "vscode";
import { ConnectionEditor } from "./webview/connectionEditor";
import { Constants } from "./common/constants";
import { QueryEditor } from "./webview/queryEditor";
import { DbConnectionNode } from "./treeview/dbConnectionNode";
import { FieldsViewProvider } from "./webview/FieldsViewProvider";
import { IndexesViewProvider } from "./webview/IndexesViewProvider";
import { GroupListProvider } from "./treeview/GroupListProvider";
import { TableNode } from "./treeview/tableNode";
import { TablesListProvider } from "./treeview/TablesListProvider";
import { DbConnectionUpdater } from "./treeview/DbConnectionUpdater";
import { IPort } from "./view/app/model";

export function activate(context: vscode.ExtensionContext) {

  Constants.context = context;
  let extensionPort: number; 

  vscode.workspace.onDidChangeConfiguration( event => {
    const affected = event.affectsConfiguration("ProBro.possiblePortsList");
    if (affected) {
      const portList: IPort[] | undefined = vscode.workspace.getConfiguration("ProBro").get("possiblePortsList");
      console.log("portList settings:", portList);
      if(portList?.length === 0) {
        vscode.window.showErrorMessage("Please provide port number @pridet mygtuka");
        return;
      }
      context.globalState.update(`${Constants.globalExtensionKey}.portList`, portList);
      console.log("portList changed: ", portList);

    }
    console.log("changed settings");
  });
    
  const connectionUpdater = new DbConnectionUpdater();
  connectionUpdater.updateConnectionStatuses(context);

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

  const tablesListProvider = new TablesListProvider(context, fieldsProvider, indexesProvider);
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
    { treeDataProvider: groupListProvider }
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
      () => { connectionUpdater.updateConnectionStatusesWithRefreshCallback(context, groupListProvider);}
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${Constants.globalExtensionKey}.query`,
      (node: TableNode) => {
        new QueryEditor(
          context,
          node,
          tablesListProvider,
          fieldsProvider
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${Constants.globalExtensionKey}.deleteConnection`,
      (dbConnectionNode: DbConnectionNode) => {
        dbConnectionNode.deleteConnection(context);
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

  vscode.commands.registerCommand( 
    `${Constants.globalExtensionKey}.list-filter`, async () => {
      const options:QuickPickItem[] = [...new Set([...tablesListProvider.tableNodes.map(table => table.tableType)])].map(label => ({label}));
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
    
      quickPick.onDidChangeSelection(async selection => {
        const filters = selection.map((type) => type.label);
        tablesListProvider.refreshList(filters);
      });

      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    }
  );

  vscode.commands.registerCommand(
    `${Constants.globalExtensionKey}.dblClickQuery`,(_) => {
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
    `${Constants.globalExtensionKey}.getPort`, (): number => {
      const portList = context.globalState.get<{[id: string]:IPort}>(`${Constants.globalExtensionKey}.portList`);

      console.log(" portList", portList);
      if (!portList) {

        console.log("empty port list");
      } else {
        for (const id of Object.keys(portList)) {
          if (!portList[id].isInUse) {
            extensionPort = portList[id].port;
            portList[id].isInUse = true;
            context.globalState.update(`${Constants.globalExtensionKey}.portList`, portList);
            break;
          }
        };
      };
      return extensionPort;
    } 
  );

  vscode.commands.registerCommand(
    `${Constants.globalExtensionKey}.releasePort`, () => {
      const portList = context.globalState.get<{[id: string]:IPort}>(`${Constants.globalExtensionKey}.portList`);

      if (!portList) {
        return;
      } else {
        for (const id of Object.keys(portList)) {
          if (portList[id].isInUse && extensionPort === portList[id].port) {
            portList[id].isInUse = false;
            context.globalState.update(`${Constants.globalExtensionKey}.portList`, portList);
            break;
          }
        };
      }
    }
  );
}
