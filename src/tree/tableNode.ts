import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { TableDetails } from "../view/app/model";
import { DatabaseListProvider } from "./DatabaseListProvider";
import { InfoNode } from "./infoNode";
import { INode } from "./INode";
import { TablesListProvider } from "./TablesListProvider";

export class TableNode implements INode {
    public tableName: string;
    public cache: TableDetails | undefined;

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
        return [];
    }

}