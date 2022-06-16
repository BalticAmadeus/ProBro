import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { DatabaseListProvider } from "./DatabaseListProvider";
import { InfoNode } from "./infoNode";
import { INode } from "./INode";

export class GroupNode implements INode {
    constructor(private context: vscode.ExtensionContext, private readonly groupName: string) {
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.groupName,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: "group",
        };
    }

    public async getChildren(): Promise<INode[]> {
        return new DatabaseListProvider(this.context, this.groupName).getChildren(undefined);
    }

}