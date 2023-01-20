import * as vscode from 'vscode';
import { PanelViewProvider } from "./panelViewProvider";

export class IndexesViewProvider extends PanelViewProvider {

    constructor (context: vscode.ExtensionContext, _type: string) {
        super(context, _type);
    }
}