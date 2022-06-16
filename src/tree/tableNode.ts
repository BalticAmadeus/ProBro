import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { DatabaseListProvider } from "./DatabaseListProvider";
import { InfoNode } from "./infoNode";
import { INode } from "./INode";
import { TablesListProvider } from "./TablesListProvider";

export class TableNode implements INode {
    public tableName: string;

    constructor(private context: vscode.ExtensionContext, tableName: string) {
        this.tableName = tableName;
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.tableName,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "table",
        };
    }

    public async getChildren(): Promise<INode[]> {
        return new TablesListProvider(this.context).getChildren(undefined);
    }

}