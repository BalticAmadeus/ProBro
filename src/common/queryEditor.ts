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
import { FieldsViewProvider } from "../tree/FieldsViewProvider";

export class QueryEditor {
  private readonly panel: vscode.WebviewPanel | undefined;
  private readonly extensionPath: string;
  private disposables: vscode.Disposable[] = [];
  public tableName: string;
  private fieldsProvider: FieldsViewProvider;

  constructor(
    private context: vscode.ExtensionContext,
    private tableNode: TableNode,
    private tableListProvider: TablesListProvider,
    private fieldProvider: FieldsViewProvider
  ) {
    this.extensionPath = context.asAbsolutePath("");
    //        this.tableNode = this.tableListProvider.node;

    this.tableName = tableNode.tableName;
    this.fieldsProvider = fieldProvider;

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

    // React.useEffect (() => {
    //   this.panel?.webview.postMessage({
    //     command: "columns",   
    //     columns: tableNode.cache?.selectedColumns,
    //   })
    // })

    this.panel.webview.onDidReceiveMessage(
      (command: ICommand) => {
        switch (command.action) {
          case CommandAction.Query:
            if (this.tableListProvider.config) {
              DatabaseProcessor.getInstance()
                .getTableData(
                  this.tableListProvider.config,
                  this.tableNode.tableName,
                  command.params
                )
                .then((oe) => {
                  if (this.panel) {
                    this.panel?.webview.postMessage({
                      id: command.id,
                      command: "data",
                      columns: tableNode.cache?.selectedColumns,
                      data: oe,
                    });
                  }
                });
              break;
            }
          case CommandAction.CRUD:
            if (this.tableListProvider.config) {
              DatabaseProcessor.getInstance()
                .getTableData(
                  this.tableListProvider.config,
                  this.tableNode.tableName,
                  command.params
                )
                .then((oe) => {
                  if (this.panel) {
                    this.panel?.webview.postMessage({
                      id: command.id,
                      command: "crud",
                      data: oe,
                    });
                  }
                });
              break;
            }
          case CommandAction.Submit:
            if (this.tableListProvider.config) {
              DatabaseProcessor.getInstance()
                .submitTableData(
                  this.tableListProvider.config,
                  this.tableNode.tableName,
                  command.params
                )
                .then((oe) => {
                  if (this.panel) {
                    this.panel?.webview.postMessage({
                      id: command.id,
                      command: "submit",
                      data: oe,
                    });
                  }
                });
              break;
            }
          case CommandAction.Export:
             if (this.tableListProvider.config) {
              DatabaseProcessor.getInstance()
                .getTableData(
                  this.tableListProvider.config,
                  this.tableNode.tableName,
                  command.params
                )
                .then((oe) => {
                  if (this.panel) {
                    this.panel?.webview.postMessage({
                      id: command.id,
                      command: "export",
                      tableName: this.tableNode.tableName,
                      data: oe,
                      format: command.params!.exportType
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

    this.fieldsProvider.addQueryEditor(this);

    this.panel.onDidDispose(
      () => {
        // When the panel is closed, cancel any future updates to the webview content
        this.fieldsProvider.removeQueryEditor(this);
      },
      null,
      context.subscriptions
    );
  }

  public updateFields() {
      this.panel?.webview.postMessage({
        command: "columns",   
        columns: this.tableNode.cache?.selectedColumns,
      });
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
          window.tableName = ${JSON.stringify(this.tableNode.tableName)};
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
  }
}
