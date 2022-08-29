import { AnyARecord } from 'dns';
import path = require('path');
import { config } from 'process';
import { v1 } from 'uuid';
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { Constants } from '../common/constants';
import { QueryEditor } from '../common/queryEditor';
import { DatabaseProcessor } from '../db/databaseProcessor';
import { CommandAction, ICommand, IConfig, TableDetails } from '../view/app/model';
import { TableNode } from './tableNode';
import { TablesListProvider } from './TablesListProvider';

export class FieldsViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = `${Constants.globalExtensionKey}-panel`;
    public _view?: vscode.WebviewView;
    public tableNode?: TableNode;
    public tableListProvider?: TablesListProvider;

    constructor(
        private context: vscode.ExtensionContext, private _type: string) {
    }

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

        this._view.webview.onDidReceiveMessage(
            (command) => {
                switch (command.action) {
                    case CommandAction.UpdateColumns:
                        if (this.tableNode !== undefined && this.tableNode.cache !== undefined) {
                            this.tableNode.cache.selectedColumns = command.columns;
                            console.log("got columns from fields.tsx: ", this.tableNode?.cache); 
                        }
                        vscode.EventEmitter

                      
                        
                        
                }
            }
        );

        // this._view.webview.onDidReceiveMessage(
        //     (command: ICommand) => {
        //         switch (command.action) {
        //             case CommandAction.FieldsRefresh:
        //                 if (this.tableNode) {
        //                     this.tableListProvider?.displayData(this.tableNode);
        //                 }
        //                 return;
        //         }
        //     }
        // );
    }

    private getWebviewContent(data: TableDetails): string {
        // Local path to main script run in the webview
        const reactAppPathOnDisk = vscode.Uri.file(
            path.join(vscode.Uri.file(this.context.asAbsolutePath(path.join("out/view/app", this._type === "fields" ? "fields.js" : "indexes.js"))).fsPath)
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