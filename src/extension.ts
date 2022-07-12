import * as vscode from 'vscode';
import { ConnectionEditor } from './common/connectionEditor';
import { Constants } from './common/constants';
import { DatabaseProcessor } from './db/databaseProcessor';
import { DetailListProvider } from './tree/DetailListProvider';
import { FieldsViewProvider } from './tree/FieldsViewProvider';
import { GroupListProvider } from './tree/GroupListProvider';
import { TablesListProvider } from './tree/TablesListProvider';

export function activate(context: vscode.ExtensionContext) {

	const fieldsProvider = new FieldsViewProvider(context);
	const fields = vscode.window.registerWebviewViewProvider(`${Constants.globalExtensionKey}-panel`, fieldsProvider, {});
	context.subscriptions.push(fields);

	const detailListProvider = new DetailListProvider(context);
	const details = vscode.window.createTreeView(`${Constants.globalExtensionKey}-details`, { treeDataProvider: detailListProvider });
	details.onDidChangeSelection(e => detailListProvider.onDidChangeSelection(e));

	const tablesListProvider = new TablesListProvider(context);
	const tables = vscode.window.createTreeView(`${Constants.globalExtensionKey}-tables`, { treeDataProvider: tablesListProvider });
	tables.onDidChangeSelection(e => tablesListProvider.onDidChangeSelection(e, detailListProvider));

	const groupListProvider = new GroupListProvider(context, tables);
	const groups = vscode.window.createTreeView(`${Constants.globalExtensionKey}-databases`, { treeDataProvider: groupListProvider });
	groups.onDidChangeSelection(e => groupListProvider.onDidChangeSelection(e, tablesListProvider));

	context.subscriptions.push(vscode.commands.registerCommand(`${Constants.globalExtensionKey}.addEntry`, () => { new ConnectionEditor(context, 'Add New Connection'); }));
	context.subscriptions.push(vscode.commands.registerCommand(`${Constants.globalExtensionKey}.refreshList`, () => { groupListProvider.refresh(); }));

	context.subscriptions.push(vscode.commands.registerCommand(`${Constants.globalExtensionKey}.proBroBonjour`, () => {
		vscode.window.showInformationMessage("Bonjour, je m'appelle ProBro.");
	}));




}

