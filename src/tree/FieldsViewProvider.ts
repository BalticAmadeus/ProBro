import path = require('path');
import * as vscode from 'vscode';
import { QueryEditor } from '../common/queryEditor';
import { CommandAction, ICommand } from '../view/app/model';
import { PanelViewProvider } from './PanelViewProvider';

export class FieldsViewProvider extends PanelViewProvider {

    private queryEditors : QueryEditor[] = [];

    constructor (context: vscode.ExtensionContext, _type: string) {
        super(context, _type);
    }

    public addQueryEditor(queryEditor : QueryEditor) {
        this.queryEditors.push(queryEditor);
    }

    public removeQueryEditor(queryEditor : QueryEditor) {
        this.queryEditors = this.queryEditors.filter(query => query !== queryEditor);
    }

    public notifyQueryEditors() {
        for (let i = 0; i < this.queryEditors.length; i++) {
            if (this.queryEditors[i].tableName === this.tableNode?.tableName) {
                this.queryEditors[i].updateFields();
            }
        } 
    }

    public resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {

        super.resolveWebviewView(webviewView);
        
        this._view!.webview.onDidReceiveMessage(
            (command: ICommand) => {
                switch (command.action) {
                    case CommandAction.UpdateColumns:
                        if (this.tableNode !== undefined && this.tableNode.cache !== undefined) {
                            this.tableNode.cache.selectedColumns = command.columns;
                        }
                        this.notifyQueryEditors();
                        break; 
                }
            }
        );
    }
}