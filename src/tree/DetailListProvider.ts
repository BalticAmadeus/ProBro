import * as vscode from 'vscode';
import { Constants } from '../common/constants';
import { INode } from './INode';
import * as detailNode from './detailNode';
import { IConfig } from '../view/app/model';
import { TablesListProvider } from './TablesListProvider';
import { DbConnectionNode } from './dbConnectionNode';

export class DetailListProvider implements vscode.TreeDataProvider<INode> {
	onDidChangeSelection(e: vscode.TreeViewSelectionChangeEvent<INode>): any {
		throw new Error('Method not implemented.');
	}
	private detailName: string | undefined;
	private _onDidChangeTreeData: vscode.EventEmitter<INode | undefined | void> = new vscode.EventEmitter<INode | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<INode | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private context: vscode.ExtensionContext/* , private tables: vscode.TreeView<INode> */) {
	}
	/*
		onDidChangeSelection(e: vscode.TreeViewSelectionChangeEvent<INode>, tablesListProvider: vscode.TreeDataProvider<INode>): any {
			if (e.selection.length) {
				if (e.selection[0] instanceof ConnectionNode && tablesListProvider instanceof TablesListProvider) {
					const node = e.selection[0] as ConnectionNode;
					console.log('GroupList', node.config);
					(tablesListProvider as TablesListProvider).refresh(node.config);
					return;
				}
			}
			(tablesListProvider as TablesListProvider).refresh(undefined);
		}
	*/
	refresh(detailName: string | undefined): void {
		this.detailName = detailName;
		this._onDidChangeTreeData.fire();
	}

	public getTreeItem(element: INode): Promise<vscode.TreeItem> | vscode.TreeItem {
		return element.getTreeItem();
	}

	public getChildren(element?: INode): Thenable<INode[]> | INode[] {
		if (!element) {
			return this.getDetailNodes();
		}
		return element.getChildren();
	}

	private async getDetailNodes(): Promise<detailNode.DetailNode[]> {
		const detailNodes: detailNode.DetailNode[] = [];
		detailNodes.push(new detailNode.DetailNode(this.context, "Fields"));
		detailNodes.push(new detailNode.DetailNode(this.context, "Indexes"));
		return detailNodes;
	}
}
