import * as vscode from 'vscode';

export class FieldsViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'calicoColors.colorsView';

    private _view?: vscode.WebviewView;

    constructor(

    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [

            ]
        };

        webviewView.webview.html = "<b>Zdravstvuj Derevo</b>";

    }
}