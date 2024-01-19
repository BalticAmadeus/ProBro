import * as vscode from 'vscode';
import { PanelViewProvider } from './PanelViewProvider';

export class IndexesViewProvider extends PanelViewProvider {

    constructor (context: vscode.ExtensionContext, _type: string) {
        super(context, _type);
    }
}