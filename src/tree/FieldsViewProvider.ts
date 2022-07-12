import path = require('path');
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { Constants } from '../common/constants';

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
            localResourceRoots: [vscode.Uri.file(path.join(this.context.asAbsolutePath(''), "out"))],
        };
        webviewView.webview.html = "<b>Custom HTML with fields should be here</b>";
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }
}