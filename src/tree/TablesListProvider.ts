import * as vscode from 'vscode';
import { Constants } from '../common/constants';
import { INode } from './INode';
import * as tableNode from './tableNode';
import { IConfig } from '../view/app/model';
import { DatabaseProcessor } from '../db/databaseProcessor';
import { DetailNode } from './detailNode';
import { TableNode } from './tableNode';
import { FieldsViewProvider } from './FieldsViewProvider';


export class TablesListProvider implements vscode.TreeDataProvider<INode> {
	private config: IConfig | undefined;

	onDidChangeSelection(e: vscode.TreeViewSelectionChangeEvent<INode>, fieldsProvider?: vscode.WebviewViewProvider): any {
		// console.log('TablesList event', e);
		if (e.selection.length && this.config) {
			if (e.selection[0] instanceof TableNode && fieldsProvider instanceof FieldsViewProvider) {
				const node = e.selection[0] as TableNode;
				console.log('TablesList', node.tableName);
				(fieldsProvider as FieldsViewProvider).refresh(this.config, node.tableName);
				return;
			}
		}
		(fieldsProvider as FieldsViewProvider).refresh(this.config, undefined);
	}

	private _onDidChangeTreeData: vscode.EventEmitter<INode | undefined | void> = new vscode.EventEmitter<INode | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<INode | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private context: vscode.ExtensionContext) {
	}

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
