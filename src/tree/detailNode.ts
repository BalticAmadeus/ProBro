import * as vscode from "vscode";
import { INode } from "./INode";

export class DetailNode implements INode {
    public detailName: string;

    constructor(private context: vscode.ExtensionContext, detailName: string) {
        this.detailName = detailName;
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.detailName,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: "detail",
        };
    }

    public async getChildren(): Promise<INode[]> {
        return [];
        //return new DetailListProvider(this.context, this.detailName).getChildren(undefined);
    }

}