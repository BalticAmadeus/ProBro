import * as vscode from "vscode";
import { ConnectionStatus, IConfig } from "../view/app/model";
import { IRefreshCallback } from "./IRefreshCallback";
import { ProcessorFactory } from "../repo/processor/ProcessorFactory";

export class DbConnectionUpdater {
  constructor() {}
  private locked: boolean = false;
  private context: vscode.ExtensionContext = {} as vscode.ExtensionContext;
  private callback: IRefreshCallback = {} as IRefreshCallback;

  public async updateConnectionStatusesWithRefreshCallback(
    context: vscode.ExtensionContext,
    callback: IRefreshCallback
  ) {
    this.context = context;
    this.callback = callback;

    try {
      if (this.locked === false) {
        this.locked = true;
        await this.updateStatuses();
        await this.updateWorkStateStatuses();
      }
    } finally {
      this.locked = false;
    }
  }

  private async updateWorkStateStatuses() {
    let connections = this.context.workspaceState.get<{
      [id: string]: IConfig;
    }>(`pro-bro.dbconfig`);

    if (!connections || Object.keys(connections).length === 0) {
      this.callback.refresh();
      return;
    }

    for (let id of Object.keys(connections)) {
      if (connections[id].conStatus === ConnectionStatus.Disabled) {
        continue;
      }
        connections![id].conStatus = ConnectionStatus.Connecting;
        this.updateWorkStateStatus(connections);
        await this.wait();

        const data = await ProcessorFactory.getProcessorInstance().getDBVersion(
          connections[id]
        );

        if (data instanceof Error || "error" in data) {
          connections[id].conStatus = ConnectionStatus.NotConnected;
        } else {
          connections[id].conStatus = ConnectionStatus.Connected;
        }
    }
    this.updateWorkStateStatus(connections);
  }

  private updateWorkStateStatus(connections: { [id: string]: IConfig }) {
    this.context.workspaceState.update(`pro-bro.dbconfig`, connections);
    this.callback.refresh();
  }

  private async updateStatuses() {
    let connections = this.context.globalState.get<{ [id: string]: IConfig }>(
      `pro-bro.dbconfig`
    );

    if (!connections || Object.keys(connections).length === 0) {
      this.callback.refresh();
      return;
    }

    for (let id of Object.keys(connections)) {
      if (connections[id].conStatus === ConnectionStatus.Disabled) {
        continue;
      }
        connections![id].conStatus = ConnectionStatus.Connecting;
        this.updateStatus(connections);
        await this.wait();

        const data = await ProcessorFactory.getProcessorInstance().getDBVersion(
          connections[id]
        );

        if (data instanceof Error || "error" in data) {
          connections[id].conStatus = ConnectionStatus.NotConnected;
        } else {
          connections[id].conStatus = ConnectionStatus.Connected;
        }
    }
    this.updateStatus(connections);
  }

  private updateStatus(connections: { [id: string]: IConfig }) {
    this.context.globalState.update(`pro-bro.dbconfig`, connections);
    this.callback.refresh();
  }

  private wait(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 250);
    });
  }
}
