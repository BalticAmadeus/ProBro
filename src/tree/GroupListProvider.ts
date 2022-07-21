import * as vscode from 'vscode';
import { Constants } from '../common/constants';
import { INode } from './INode';
import * as groupNode from './groupNode';
import { IConfig } from '../view/app/model';
import { TablesListProvider } from './TablesListProvider';
import { ConnectionNode } from './connectionNode';

export class GroupListProvider implements vscode.TreeDataProvider<INode> {
	private _onDidChangeTreeData: vscode.EventEmitter<INode | undefined | void> = new vscode.EventEmitter<INode | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<INode | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private context: vscode.ExtensionContext, private tables: vscode.TreeView<INode>) {
	}

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

	refresh(): void {
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

	private async getGroupNodes(): Promise<groupNode.GroupNode[]> {
		const connections = this.context.globalState.get<{ [key: string]: IConfig }>(`${Constants.globalExtensionKey}.dbconfig`);
		const groupNodes: groupNode.GroupNode[] = [];
		var groupNames: string[] = [];
		if (connections) {
			for (const id of Object.keys(connections)) {
				let group = connections[id].group.toUpperCase();
				if (!group) { group = "<EMPTY>"; }
				if (groupNames.indexOf(group) == -1) {
					groupNames.push(group);
					groupNodes.push(new groupNode.GroupNode(this.context, group));
				}
			}
		}
		return groupNodes;
	}
}