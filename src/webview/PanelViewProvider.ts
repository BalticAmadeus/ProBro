import path = require('path');
import * as vscode from 'vscode';
import { Constants } from '../common/Constants';
import { TableDetails } from '../view/app/model';
import { TableNode } from '../treeview/TableNode';
import { TablesListProvider } from '../treeview/TablesListProvider';

export class PanelViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = `${Constants.globalExtensionKey}-panel`;
    public _view?: vscode.WebviewView;
    public tableNode?: TableNode;
    public tableListProvider?: TablesListProvider;
    public readonly configuration = vscode.workspace.getConfiguration("ProBro");

    constructor (private context: vscode.ExtensionContext, private _type: string) {}

    public resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.asAbsolutePath(''), "out"))
            ]
        };
        this._view.webview.html = this.getWebviewContent({ fields: [], indexes: [], selectedColumns: [] });

        this._view.onDidChangeVisibility(ev => {
            if (this._view?.visible) {
                if (this.tableNode) {
                    this.tableListProvider?.displayData(this.tableNode);
                }
            }
        });
    }

    private getWebviewContent(data: TableDetails): string {
        // Local path to main script run in the webview
        const reactAppPathOnDisk = vscode.Uri.file(
            path.join(vscode.Uri.file(this.context.asAbsolutePath(path.join("out/view/app", `${this._type}.js`))).fsPath)
        );

        const reactAppUri = this._view?.webview.asWebviewUri(reactAppPathOnDisk);
        const cspSource = this._view?.webview.cspSource;

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
          window.tableDetails = ${JSON.stringify(data)};
          window.configuration = ${JSON.stringify(this.configuration)};
          window.tableName = ${JSON.stringify(this.tableNode?.tableName)};
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
    }
}