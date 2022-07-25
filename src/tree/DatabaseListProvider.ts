import * as vscode from 'vscode';
import { Constants } from '../common/constants';
import { IConfig } from '../view/app/model';
import { INode } from './INode';
import * as connectionNode from './connectionNode';

export class DatabaseListProvider implements vscode.TreeDataProvider<INode> {

	private _onDidChangeTreeData: vscode.EventEmitter<INode | undefined | void> = new vscode.EventEmitter<INode | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<INode | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private context: vscode.ExtensionContext, private readonly groupName: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public getTreeItem(element: INode): Promise<vscode.TreeItem> | vscode.TreeItem {
		//console.log(element.getTreeItem());
		return element.getTreeItem();
	}

	public getChildren(element?: INode): Thenable<INode[]> | INode[] {
		if (!element) {
			return this.getConnectionNodes();
		}

		return element.getChildren();
	}
	private async getConnectionNodes(): Promise<connectionNode.ConnectionNode[]> {
		const connections = this.context.globalState.get<{ [key: string]: IConfig }>(`${Constants.globalExtensionKey}.dbconfig`);
		const connectionNodes = [];
		if (connections) {
			for (const id of Object.keys(connections)) {
				let group = connections[id].group.toUpperCase();
				if (!group) { group = "<EMPTY>"; }
				if (group == this.groupName) {
					let node = new connectionNode.ConnectionNode(id, connections[id]);
					connectionNodes.push(node);
				}
			}
		}
		return connectionNodes;
	}
}
