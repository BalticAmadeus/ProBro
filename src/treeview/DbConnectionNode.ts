import * as vscode from "vscode";
import path = require("path");
import { INode } from "./INode";
import { ConnectionStatus, IConfig } from "../view/app/model";
import { ConnectionEditor } from "../webview/ConnectionEditor";
import { spawn } from "child_process";
import { Constants } from "../common/Constants";
import { v4 as uuid } from "uuid";
import { DbConnectionUpdater } from "./DbConnectionUpdater";
import { IRefreshCallback } from "./IRefreshCallback";

export class DbConnectionNode implements INode {
  public readonly id: string;
  public readonly config: IConfig;
  private readonly refreshCallback: IRefreshCallback;
  

  constructor(
    id: string,
    config: IConfig,
    refreshCallback: IRefreshCallback,
    private context: vscode.ExtensionContext
  ) {
    this.id = id;
    this.config = config;
    this.refreshCallback = refreshCallback;
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

  public refreshConnection(context: vscode.ExtensionContext) {
    const dbConnectionUpdater = new DbConnectionUpdater();
    const connectionId = this.config.id;

    dbConnectionUpdater.updateSingleConnectionStatusWithRefreshCallback(
      connectionId,
      context,
      this.refreshCallback,
    );
  }

  private getAllConnections() {
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
      connectionId: "LOCAL",
      type: 0,
    };

    if (this.id) {
      let connections = this.context.globalState.get<{
        [id: string]: IConfig;
      }>(`${Constants.globalExtensionKey}.dbconfig`);

      if (connections && !connections[this.id]) {
        connections = this.context.workspaceState.get<{
          [id: string]: IConfig;
        }>(`${Constants.globalExtensionKey}.dbconfig`);
      }
      if (connections) {
        return connections[this.id];
      }
    }
    return configDB;
  }

  private createConnectionString(configDB: IConfig) {
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
    if (configDB.host) {
      dbContent += "-H " + configDB.host + " ";
    }
    if (configDB.port) {
      dbContent += "-S " + configDB.port + " ";
    }
    if (configDB.params) {
      dbContent += configDB.params;
    }

    return dbContent;
  }

  private scriptLauncher(
    scriptPath: string,
    procedureName: string,
    dbContent: string
  ) {
    const dlc = Constants.dlc;
    // Spawn the child process to execute the .bat script
    const child = spawn(scriptPath, [dlc, procedureName, dbContent]);

    // Listen for data from the .bat script (if needed)
    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    child.on("error", (error) => console.log("child process error: \n", error));

    // Listen for the process exit event
    child.on("exit", (code) => {
      console.log(`Child process exited with code ${code}`);
    });
  }

  private selectTool(name: string) {
    if (name === "dataAdministration") {
      return "-p _admin.p";
    } else if (name === "dataDictionary") {
      return "-p _dict.p";
    }
    return "";
  }

  public runScript(context: vscode.ExtensionContext, scriptName: string) {
    if (process.platform === "win32") {
      const scriptPath = path.join(
        Constants.context.extensionPath,
        "resources",
        "oe",
        "scripts",
        "OeTools.bat"
      );

      const procedureName = this.selectTool(scriptName);

      const configDB: IConfig = this.getAllConnections();

      const dbContent = this.createConnectionString(configDB);

      this.scriptLauncher(scriptPath, procedureName, dbContent);
    } else if (process.platform === "linux") {
      //to do
    }
  }
}
