import * as vscode from "vscode";
import path = require("path");
import { INode } from "./INode";
import { IConfig } from "../view/app/model";
import { ConnectionEditor } from "../webview/ConnectionEditor";

export class DbConnectionNode implements INode {
  public readonly id: string;
  public readonly config: IConfig;

  constructor(id: string, config: IConfig, private context: vscode.ExtensionContext) {
    this.id = id;
    this.config = config;
  }

  public getTreeItem(): vscode.TreeItem {
    return {
      label: this.config.label,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      description: this.config.description,
      contextValue: "dbConnection",
      iconPath: path.join(
        __filename,
        "..",
        "..",
        "..",
        "resources/icon",
        this.config.conStatus ? "progress_icon.svg" : "progress_icon_stop.svg",
      ),
    };
  }

  public async getChildren(): Promise<INode[]> {
    return [];
  }

  public async deleteConnection(context: vscode.ExtensionContext) {
    //TODO fix and move to someplace else

    let connections = context.globalState.get<{ [id: string]: IConfig }>(`pro-bro.dbconfig`);
    if (!connections) {
        connections = {};
    }
    delete connections[this.config.id];
    this.context.globalState.update(`pro-bro.dbconfig`, connections);
    vscode.commands.executeCommand(`pro-bro.refreshList`);
  }

  public editConnection(context: vscode.ExtensionContext) {
    new ConnectionEditor(context, "Edit Connection", this.id);
  }
}
