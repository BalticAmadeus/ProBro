import * as vscode from 'vscode';
import path = require("path");
import { INode } from "./INode";
import { IConfig } from '../view/app/model';

export class ConnectionNode implements INode {
    public readonly id: string;
    public readonly config: IConfig

    constructor(id: string, config: IConfig) {
        this.id = id;
        this.config = config;
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.config.name,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "connection",
            iconPath: path.join(__filename, "..", "..", "..", "resources", "server.png"),
        };
    }

    public async getChildren(): Promise<INode[]> {
        return [];
    }

}