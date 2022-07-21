import path = require("path");
import * as vscode from "vscode";
import { ICommand, CommandAction, IConfig } from "../view/app/model";
import * as fs from "fs";
import { v1 as uuidv1, v1 } from "uuid";
import { Constants } from "./constants";
import { DatabaseProcessor } from "../db/databaseProcessor";
import { IOETableData } from "../db/oe";

export class QueryEditor {
    private readonly panel: vscode.WebviewPanel | undefined;
    private readonly extensionPath: string;
    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext, private config: IConfig, private table: string | undefined) {
        this.extensionPath = context.asAbsolutePath('');

        this.panel = vscode.window.createWebviewPanel(
            "queryOETable", // Identifies the type of the webview. Used internally
            `Query of ${this.table}`, // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.asAbsolutePath(''), "out"))
                ]
            }
        );
        new DatabaseProcessor(context).getTableData(config, table).then((oe) => {
            if (this.panel) { this.panel.webview.html = this.getWebviewContent(oe); };
        });

        this.panel.webview.onDidReceiveMessage(
            (command: ICommand) => {
                switch (command.action) {
                    case CommandAction.Test:
                        new DatabaseProcessor(context).getDBVersion(command.content).then((oe) => {
                            console.log(`Requested version of DB: ${oe.dbversion}`);
                            this.panel?.webview.postMessage({ id: command.id, command: 'ok' });
                        });
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

    private getWebviewContent(tableData: IOETableData): string {
        // Local path to main script run in the webview
        const reactAppPathOnDisk = vscode.Uri.file(
            path.join(vscode.Uri.file(this.context.asAbsolutePath(path.join("out/view/app", "query.js"))).fsPath)
        );
        const reactAppUri = reactAppPathOnDisk.with({ scheme: "vscode-resource" });

        // const config: IConfig = {
        //     id: v1(),
        //     name: "",
        //     description: "",
        //     host: "",
        //     port: "",
        //     user: "",
        //     password: "",
        //     group: "",
        //     params: ""
        // };

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