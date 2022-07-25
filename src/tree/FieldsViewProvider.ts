import { AnyARecord } from 'dns';
import path = require('path');
import { v1 } from 'uuid';
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { Constants } from '../common/constants';
import { DatabaseProcessor } from '../db/databaseProcessor';
import { IConfig, TableDetails } from '../view/app/model';

export class FieldsViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = `${Constants.globalExtensionKey}-panel`;
    private _view?: vscode.WebviewView;

    constructor(
        private context: vscode.ExtensionContext, private _type: string) {
    }

    public refresh(config: IConfig | undefined, tableName?: string) {
        return new DatabaseProcessor(this.context).getTableDetails(config, tableName).then((oeTableDetails) => {
            if (this._view) {
                this._view.webview.html = this.getWebviewContent(oeTableDetails);
            }
        });
    }

    public resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.asAbsolutePath(''), "out"))
            ]
        };
        this._view.webview.html = this.getWebviewContent({ fields: [], indexes: [] });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private getWebviewContent(data: TableDetails): string {
        // Local path to main script run in the webview
        const reactAppPathOnDisk = vscode.Uri.file(
            path.join(vscode.Uri.file(this.context.asAbsolutePath(path.join("out/view/app", this._type == "fields" ? "fields.js" : "indexses.js"))).fsPath)
        );
        const reactAppUri = reactAppPathOnDisk.with({ scheme: "vscode-resource" });
        const displayType = this._type;

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
          window.initialData = ${JSON.stringify(data)};
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
    }
}