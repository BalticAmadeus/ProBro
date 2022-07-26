import * as vscode from 'vscode';
import { Constants } from '../common/constants';
import { INode } from './INode';
import * as tableNode from './tableNode';
import { CommandAction, ICommand, IConfig } from '../view/app/model';
import { DatabaseProcessor } from '../db/databaseProcessor';
import { DetailNode } from './detailNode';
import { TableNode } from './tableNode';
import { FieldsViewProvider } from './FieldsViewProvider';
import { v1 } from 'uuid';


export class TablesListProvider implements vscode.TreeDataProvider<INode> {
	public config: IConfig | undefined;
	public node: TableNode | undefined;

	constructor(private context: vscode.ExtensionContext, private fieldsProvider: FieldsViewProvider, private indexesProvider: FieldsViewProvider) {
	}

	public displayData(node: TableNode) {
		if (node.cache) {
			this.fieldsProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: node.cache });
			this.indexesProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: node.cache });
			return;
		} else {
			return new DatabaseProcessor(this.context).getTableDetails(this.config, node.tableName).then((oeTableDetails) => {
				if (this.node) { this.node.cache = oeTableDetails; }
				this.fieldsProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: oeTableDetails });
				this.indexesProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: oeTableDetails });
			}).catch((err) => {
				vscode.window.showErrorMessage(err);
				this.fieldsProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: null });
				this.indexesProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: null });
			});
		}
	}

	onDidChangeSelection(e: vscode.TreeViewSelectionChangeEvent<INode>): any {
		console.log('TablesList event', e);
		if (e.selection.length && this.config) {
			if (e.selection[0] instanceof TableNode) {
				this.node = e.selection[0] as TableNode;
				this.fieldsProvider.tableNode = this.node;
				this.indexesProvider.tableNode = this.node;
				console.log('FieldsList', this.node.tableName);
				this.displayData(this.node);
			}
		}
		this.fieldsProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: null });
		this.indexesProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: null });
	}

	public _onDidChangeTreeData: vscode.EventEmitter<INode | undefined | void> = new vscode.EventEmitter<INode | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<INode | undefined | void> = this._onDidChangeTreeData.event;

	public refresh(config: IConfig | undefined): void {
		this.config = config;
		this._onDidChangeTreeData.fire();
	}

	public getTreeItem(element: INode): Promise<vscode.TreeItem> | vscode.TreeItem {
		return element.getTreeItem();
	}

	public getChildren(element?: INode): Thenable<INode[]> | INode[] {
		if (!element) {
			return this.getGroupNodes();
		}
		return element.getChildren();
	}

	private async getGroupNodes(): Promise<tableNode.TableNode[]> {
		if (this.config) {
			return new DatabaseProcessor(this.context).getTablesList(this.config).then((oeTables) => {
				const tableNodes: tableNode.TableNode[] = [];
				console.log(`Requested tables list of DB: ${this.config?.name}`);
				oeTables.tables.forEach((table) => {
					tableNodes.push(new tableNode.TableNode(this.context, table));
				});
				return tableNodes;
			});
		} else {
			return [];
		}
	}
}
