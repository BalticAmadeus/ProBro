import path = require('path');
import * as vscode from 'vscode';
import { QueryEditor } from './QueryEditor';
import { CommandAction, ICommand } from '../view/app/model';
import { PanelViewProvider } from './PanelViewProvider';
import { Logger } from "../common/Logger";

export class FieldsViewProvider extends PanelViewProvider {
    private queryEditors: QueryEditor[] = [];

    private logger = new Logger(this.configuration.get("logging.node")!);

    constructor(context: vscode.ExtensionContext, _type: string) {
        super(context, _type);
    }

    public addQueryEditor(queryEditor: QueryEditor) {
        this.queryEditors.push(queryEditor);
    }

    public removeQueryEditor(queryEditor: QueryEditor) {
        this.queryEditors = this.queryEditors.filter(
            (query) => query !== queryEditor
        );
    }

    public notifyQueryEditors() {
        for (let i = 0; i < this.queryEditors.length; i++) {
            if (this.queryEditors[i].tableName === this.tableNode?.tableName) {
                this.queryEditors[i].updateFields();
            }
        }
    }

    public notifyFocusColumn() {
        for (let i = 0; i < this.queryEditors.length; i++) {
            if (this.queryEditors[i].tableName === this.tableNode?.tableName) {
                this.queryEditors[i].focusColumn();
            }
        }
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView
    ): void | Thenable<void> {
        super.resolveWebviewView(webviewView);

        this._view!.webview.onDidReceiveMessage((command: ICommand) => {
            this.logger.log("Command:", command);
            switch (command.action) {
                case CommandAction.UpdateColumns:
                    if (command.columns?.length === 0) {
                        break;
                    }

                    if (
                        this.tableNode !== undefined &&
                        this.tableNode.cache !== undefined
                    ) {
                        this.tableNode.cache.selectedColumns = command.columns;
                    }
                    this.context.globalState.update(`selectedColumns.${this.tableNode!.getFullName()}`, command.columns);

                    this.logger.log(
                        "this.tableNode.cache.selectedColumns:",
                        command.columns
                    );
                    this.notifyQueryEditors();
                    break;

                case CommandAction.FocusColumn:
                    if (command.columns?.length === 0) {
                        break;
                    }

                    if (
                        this.tableNode !== undefined &&
                        this.tableNode.cache !== undefined
                    ) {
                        this.tableNode.cache.focusColumn = command.columns;
                    }
                    this.notifyFocusColumn();
                    break;
            }
        });
    }
}