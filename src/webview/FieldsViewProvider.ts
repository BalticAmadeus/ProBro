import { CommandAction, ICommand } from '@app/model';
import { Logger } from '@src/common/Logger';
import { HighlightFieldsCommand } from '@src/common/commands/fieldsCommands';
import { updateSelectedColumnsCache } from '@src/repo/utils/cache';
import { PanelViewProvider } from '@src/webview/PanelViewProvider';
import { QueryEditor } from '@src/webview/QueryEditor';
import * as vscode from 'vscode';

export class FieldsViewProvider extends PanelViewProvider {
    private queryEditors: QueryEditor[] = [];

    private logger = new Logger(
        this.configuration.get('logging.node') ?? false
    );

    public addQueryEditor(queryEditor: QueryEditor) {
        this.queryEditors.push(queryEditor);
    }

    public removeQueryEditor(queryEditor: QueryEditor) {
        this.queryEditors = this.queryEditors.filter(
            (query) => query !== queryEditor
        );
    }

    public notifyQueryEditors() {
        for (const queryEditor of this.queryEditors) {
            if (queryEditor.tableName === this.tableNode?.tableName) {
                queryEditor.updateFields();
            }
        }
    }

    /**
     * Highlights the QueryEditors column
     * @param {HighlightFieldsCommand} command command object
     */
    public highlightQueryEditorsColumn(command: HighlightFieldsCommand) {
        const firstEditor = this.queryEditors.find(
            (val) => val.tableName === command.tableName
        );

        firstEditor?.panel?.reveal();
        firstEditor?.highlightColumn(command.column);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView
    ): void | Thenable<void> {
        super.resolveWebviewView(webviewView);

        this._view?.webview.onDidReceiveMessage((command: ICommand) => {
            this.logger.log('Command:', command);
            switch (command.action) {
                case CommandAction.UpdateColumns:
                    if (command.columns?.length === 0) {
                        break;
                    }

                    if (this.tableNode?.cache) {
                        this.tableNode.cache.selectedColumns = command.columns;
                    }

                    updateSelectedColumnsCache(
                        this.tableNode,
                        command.columns ?? []
                    );

                    this.logger.log(
                        'this.tableNode.cache.selectedColumns:',
                        command.columns
                    );
                    this.notifyQueryEditors();
                    break;
                case CommandAction.FieldsHighlightColumn:
                    this.highlightQueryEditorsColumn(
                        command as HighlightFieldsCommand
                    );
                    break;
            }
        });
    }
}
