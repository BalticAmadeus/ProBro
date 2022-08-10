import path = require("path");
import * as vscode from "vscode";
import { ICommand, CommandAction, IConfig } from "../view/app/model";
import * as fs from "fs";
import { v1 as uuidv1, v1 } from "uuid";
import { Constants } from "./constants";
import { DatabaseProcessor } from "../db/databaseProcessor";
import { IOETableData } from "../db/oe";
import { TableNode } from "../tree/tableNode";
import { TablesListProvider } from "../tree/TablesListProvider";

export class QueryEditor {
  private readonly panel: vscode.WebviewPanel | undefined;
  private readonly extensionPath: string;
  private disposables: vscode.Disposable[] = [];
  //private tableNode?: TableNode;

  constructor(
    private context: vscode.ExtensionContext,
    private tableNode: TableNode,
    private tableListProvider: TablesListProvider
  ) {
    this.extensionPath = context.asAbsolutePath("");
    //        this.tableNode = this.tableListProvider.node;

    this.panel = vscode.window.createWebviewPanel(
      "queryOETable", // Identifies the type of the webview. Used internally
      `Query of ${this.tableNode.tableName}`, // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.asAbsolutePath(""), "out")),
        ],
      }
    );

    if (this.panel) {
      this.panel.webview.html = this.getWebviewContent({
        columns: [],
        data: [],
      });
    }

    this.panel.webview.onDidReceiveMessage(
      (command: ICommand) => {
        switch (command.action) {
          case CommandAction.Query:
            if (this.tableListProvider.config) {
              new DatabaseProcessor(context)
                .getTableData(
                  this.tableListProvider.config,
                  this.tableNode.tableName,
                  command.params.where,
                  command.params.start,
                  command.params.pageLength,
                  command.params.lastRowID,
                  command.params.sortColumns,
                  command.params.filters,
                  command.params.timeOut
                )
                .then((oe) => {
                  if (this.panel) {
                    this.panel?.webview.postMessage({
                      id: command.id,
                      command: "data",
                      data: oe,
                    });
                  }
                });
              break;
            }
          case CommandAction.Export:
            console.log("config: ", this.tableListProvider.config);
            if (this.tableListProvider.config) {
              new DatabaseProcessor(context)
                .getTableData(
                  this.tableListProvider.config,
                  this.tableNode.tableName,
                  command.params.where,
                  command.params.start,
                  command.params.pageLength,
                  command.params.lastRowID,
                  command.params.sortColumns,
                  command.params.filters,
                  command.params.timeOut
                )
                .then((oe) => {
                  if (this.panel) {
                    console.log(`Requested data: ${this.tableNode.tableName}`);
                    this.panel?.webview.postMessage({
                      id: command.id,
                      command: "export",
                      data: oe,
                    });
                  }
                });
            };
            break;
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

  private getWebviewContent(tableData: IOETableData): string {
    // Local path to main script run in the webview
    const reactAppPathOnDisk = vscode.Uri.file(
      path.join(
        vscode.Uri.file(
          this.context.asAbsolutePath(path.join("out/view/app", "query.js"))
        ).fsPath
      )
    );
    const reactAppUri = reactAppPathOnDisk.with({ scheme: "vscode-resource" });

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Config View</title>
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none';
                      img-src https:;
                      script-src 'unsafe-eval' 'unsafe-inline' vscode-resource:;
                      style-src vscode-resource: 'unsafe-inline';">

        <script>
          window.acquireVsCodeApi = acquireVsCodeApi;
          window.tableData = ${JSON.stringify(tableData)};
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
  }
}
