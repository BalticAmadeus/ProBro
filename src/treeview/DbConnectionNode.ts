import * as vscode from "vscode";
import path = require("path");
import { INode } from "./INode";
import { ConnectionStatus, IConfig } from "../view/app/model";
import { ConnectionEditor } from "../webview/ConnectionEditor";
import { spawn } from "child_process";
import { Constants } from "../common/Constants";
import { v4 as uuid } from "uuid";

export class DbConnectionNode implements INode {
  public readonly id: string;
  public readonly config: IConfig;

  constructor(
    id: string,
    config: IConfig,
    private context: vscode.ExtensionContext
  ) {
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
        "resources",
        "icon",
        this.iconChooser()
      ),
    };
  }

  private iconChooser() {
    switch (this.config.conStatus) {
      case ConnectionStatus.Connected:
        return "progress_icon.svg";
      case ConnectionStatus.NotConnected:
        return "progress_icon_stop.svg";
      case ConnectionStatus.Connecting:
        return "loading.gif";
      default:
        return "progress_icon_stop.svg";
    }
  }

  public async getChildren(): Promise<INode[]> {
    return [];
  }

  public async deleteConnection(context: vscode.ExtensionContext) {
    //TODO fix and move to someplace else

    let connections = context.globalState.get<{ [id: string]: IConfig }>(
      `pro-bro.dbconfig`
    );
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

  public procedureEditor(context: vscode.ExtensionContext) {
    // Replace 'path/to/myscript.bat' with the actual path to your .bat script
    const shit = path.join(
      Constants.context.extensionPath,
      "resources",
      "oe",
      "scripts",
      "procedureEditor.bat"
    );

    const dlc = Constants.dlc;

    let configDB: IConfig = {
      id: uuid(),
      label: "",
      name: "",
      description: "",
      host: "",
      port: "",
      user: "",
      password: "",
      group: "",
      params: "",
    };
    if (this.id) {
      const connections = this.context.globalState.get<{
        [id: string]: IConfig;
      }>(`${Constants.globalExtensionKey}.dbconfig`);
      if (connections) {
        configDB = connections[this.id];
      }
    }

    let dbContent = "";

    if (configDB.name) {
      dbContent += "-db " + configDB.name + " ";
    }
    if (configDB.user) {
      dbContent += "-U " + configDB.user + " ";
    }
    if (configDB.password) {
      dbContent += "-P " + configDB.password + " ";
    }
    if (configDB.password) {
      dbContent += "-H " + configDB.host + " ";
    }
    if (configDB.password) {
      dbContent += "-S " + configDB.port + " ";
    }
    if (configDB.params) {
      dbContent += configDB.params;
    }

    // Spawn the child process to execute the .bat script
    const child = spawn(shit, [dlc, dbContent]);

    // Listen for data from the .bat script (if needed)
    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    // Listen for the process exit event
    child.on("exit", (code) => {
      console.log(`Child process exited with code ${code}`);
    });
  }
}
