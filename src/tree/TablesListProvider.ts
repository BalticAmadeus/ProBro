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
	private tableNodes: tableNode.TableNode[] = [];
	private filters: String[] | undefined = ["UserTable"];

	constructor(private context: vscode.ExtensionContext, private fieldsProvider: FieldsViewProvider, private indexesProvider: FieldsViewProvider) {
	}

	public displayData(node: TableNode) {
		this.fieldsProvider.tableNode = node;
		this.indexesProvider.tableNode = node;
		console.log("displayData", node.tableName);
		if (node.cache) {
			this.fieldsProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: node.cache });
			this.indexesProvider._view?.webview.postMessage({ id: v1(), command: 'data', data: node.cache });
			return;
		} else {
			return DatabaseProcessor.getInstance().getTableDetails(this.config, node.tableName).then((oeTableDetails) => {
				node.cache = oeTableDetails;
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
	
	public refreshList(filters:String[] | undefined): void {
		this.filters = filters;
		this._onDidChangeTreeData.fire();
	}

	public getTreeItem(element: INode): Promise<vscode.TreeItem> | vscode.TreeItem {
		return element.getTreeItem();
	}

	public getChildren(element?: INode): Thenable<INode[]> | INode[] {
		if (!element) {		
			return this.getFilteredTables();
		}
		return element.getChildren();
	}

	private async getGroupNodes() {
		if (this.config) {
			return DatabaseProcessor.getInstance().getTablesList(this.config).then((oeTables) => {
				this.tableNodes = [];
				console.log(`Requested tables list of DB: ${this.config?.name}`);
				 return oeTables.tables.forEach((table) => {
					this.tableNodes?.push(new tableNode.TableNode(this.context, table.name, table.tableType));
				});
			});
		} else {
			this.tableNodes = [];
		}
	
	}

	public async getFilteredTables(): Promise<tableNode.TableNode[]>  {	
		if (this.tableNodes.length === 0) {
			await this.getGroupNodes();
		}

		return this.tableNodes.filter((table) => {
			return this.filters?.includes(table.tableType);
		});
	}
}
