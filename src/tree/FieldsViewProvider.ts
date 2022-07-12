import path = require('path');
import { v1 } from 'uuid';
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { Constants } from '../common/constants';
import { IConfig } from '../view/app/model';

export class FieldsViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = `${Constants.globalExtensionKey}-panel`;
    //private _view: vscode.WebviewView = null;

    private _view?: vscode.WebviewView;

    constructor(
        private context: vscode.ExtensionContext,
    ) {
        this._view = undefined;
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.asAbsolutePath(''), "out"))
            ]
        };
        this._view.webview.html = this.getWebviewContent();
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private getWebviewContent(): string {
        // Local path to main script run in the webview
        const reactAppPathOnDisk = vscode.Uri.file(
            path.join(vscode.Uri.file(this.context.asAbsolutePath(path.join("out/view/app", "fields.js"))).fsPath)
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
          window.initialData = ${JSON.stringify('')};
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
    }
}