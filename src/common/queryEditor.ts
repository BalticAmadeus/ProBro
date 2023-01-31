import path = require("path");
import * as vscode from "vscode";
import { ICommand, CommandAction, IConfig } from "../view/app/model";
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
  private readonly configuration = vscode.workspace.getConfiguration("ProBro");

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
      `${this.tableListProvider.config?.label}.${this.tableNode.tableName}`, // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.asAbsolutePath(""), "out")),
        ],
      }
    );

    this.panel.iconPath = {
      dark: vscode.Uri.file(path.join( this.extensionPath, "resources", "icon", "query-icon-dark.svg")),
      light: vscode.Uri.file(path.join( this.extensionPath, "resources", "icon", "query-icon-light.svg"))
    };

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
                    const exportData =
                      command.params?.exportType === "dumpFile"
                        ? this.formatDumpFile(
                            oe,
                            this.tableNode.tableName,
                            this.tableListProvider.config!.label
                          )
                        : oe;
                    this.panel?.webview.postMessage({
                      id: command.id,
                      command: "export",
                      tableName: this.tableNode.tableName,
                      data: exportData,
                      format: command.params!.exportType,
                    });
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
        // When the panel is closed, cancel any future updates to the webview content
        this.fieldsProvider.removeQueryEditor(this);
      },
      null,
      context.subscriptions
    );
  }

  private formatDumpFile(data: any, fileName: string, dbName: string) {
    const dumpData = data.rawData.reduce((accumulator: string, row: any) => {
      return (
        accumulator +
        Object.entries(row)
          .filter((element) => element[0] !== "ROWID")
          .reduce((accumulator: any, element: any, index) => {
            if (index > 0 && accumulator.length !== 0) {
              accumulator += " ";
            }
            // typeof null === "object"
            if (typeof element[1] === "object") {
              return accumulator + "?";
            }
            const column = data.columns.find(
              (column: { name: string }) => column.name === element[0]
            );
            switch (column.type) {
              case "decimal":
                if (element[1] < 1 && element[1] > 0) {
                  return accumulator + element[1].toString().slice(1);
                }
              case "integer":
              case "int64":
                return accumulator + element[1];
              case "raw":
              case "character":
                const formatted = element[1].replace(/\"/g, `""`);
                return accumulator + `\"${formatted}\"`;
              case "date":
                const tempDate = new Date(element[1]);
                const tempYMD = {
                  y: tempDate.getFullYear().toString().slice(2),
                  m: (tempDate.getMonth() + 1).toString().padStart(2, "0"),
                  d: tempDate.getDate().toString().padStart(2, "0"),
                };
                const tempDateFormat = data.PSC.dateformat.substring(0, 3);
                const date = tempDateFormat
                  .split("")
                  .map((letter: string) => {
                    return tempYMD[letter as keyof typeof tempYMD];
                  })
                  .join("/");
                return accumulator + date;
              case "datetime":
              case "datetime-tz":
                return accumulator + element[1];
              case "logical":
                return accumulator + (element[1] ? "yes" : "no");
              default:
                return accumulator.slice(0, -1);
            }
          }, "") +
        "\r\n"
      );
    }, "");

    const trailerInfo = `PSC\r\n`
        + `filename=${fileName}\r\n`
        + `records=${String(data.rawData.length).padStart(13, "0")}\r\n`
        + `ldbname=${dbName}\r\n`
        + `timestamp=${data.PSC.timestamp}\r\n`
        + `numformat=${data.PSC.numformat}\r\n`
        + `dateformat=${data.PSC.dateformat}\r\n`
        + `map=NO-MAP\r\n`
        + `cpstream=${data.PSC.cpstream}\r\n`
        + `.\r\n`
        + `${String(dumpData.length + 3).padStart(10, "0")}\r\n`;

    return dumpData + ".\r\n" + trailerInfo;
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

    const reactAppUri = this.panel?.webview.asWebviewUri(reactAppPathOnDisk);
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
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
  }
}
