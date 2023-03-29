import path = require('path');
import * as vscode from 'vscode';
import { QueryEditor } from './QueryEditor';
import { CommandAction, ICommand, TableDetails } from '../view/app/model';
import { PanelViewProvider } from './PanelViewProvider';
import { Logger } from "../common/Logger";
import { PreferedTablesManager } from '../common/PreferedTablesManager';
import { PreferedTablesManagerHelper } from '../common/PreferedTablesManagerHelper';
import { TableNode } from '../treeview/TableNode';

export class FieldsViewProvider extends PanelViewProvider {
  private queryEditors: QueryEditor[] = [];

  private logger = new Logger(this.configuration.get("logging.node")!);
  private preferedTablesManager : PreferedTablesManager;
  private preferedTablesManagerHelper : PreferedTablesManagerHelper;

  constructor(context: vscode.ExtensionContext, _type: string) {
    super(context, _type);
    this.preferedTablesManager = PreferedTablesManager.getInstance(context);
    this.preferedTablesManagerHelper = PreferedTablesManagerHelper.getInstance();
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

  private async saveRows(tableNode: TableNode, cache : TableDetails){
      await this.preferedTablesManager.saveOnClick(tableNode.tableName, cache);
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    super.resolveWebviewView(webviewView);

    this._view!.webview.onDidReceiveMessage((command: ICommand) => {
      this.logger.log("Command:", command);
      if (this.tableNode !== undefined && this.tableNode.cache !== undefined){
        switch (command.action) {
          case CommandAction.UpdateColumns:
            this.tableNode.cache.selectedColumns = command.columns;
            this.saveRows(this.tableNode, this.tableNode.cache);
            this.logger.log(
              "this.tableNode.cache.selectedColumns:",
              command.columns
            );
            this.notifyQueryEditors();
            break;
          case CommandAction.LoadSavedRows:
            this.preferedTablesManager.saveTableSelectedRows(this.tableNode.tableName);
            break;
        }
      }
    });
  }
}