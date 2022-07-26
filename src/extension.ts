import * as vscode from "vscode";
import { ConnectionEditor } from "./common/connectionEditor";
import { Constants } from "./common/constants";
import { QueryEditor } from "./common/queryEditor";
import { DatabaseProcessor } from "./db/databaseProcessor";
import { DbConnectionNode } from "./tree/dbConnectionNode";
import { DetailListProvider } from "./tree/DetailListProvider";
import { FieldsViewProvider } from "./tree/FieldsViewProvider";
import { GroupListProvider } from "./tree/GroupListProvider";
import { TableNode } from "./tree/tableNode";
import { TablesListProvider } from "./tree/TablesListProvider";

export function activate(context: vscode.ExtensionContext) {
  const fieldsProvider = new FieldsViewProvider(context, "fields");
  const fields = vscode.window.registerWebviewViewProvider(
    `${Constants.globalExtensionKey}-fields`,
    fieldsProvider,
    {}
  );
  context.subscriptions.push(fields);

  const indexesProvider = new FieldsViewProvider(context, "indexes");
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
      () => {
        groupListProvider.refresh();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${Constants.globalExtensionKey}.query`,
      (node: TableNode) => {
        new QueryEditor(
          context,
          node,
          tablesListProvider
        )
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
}
