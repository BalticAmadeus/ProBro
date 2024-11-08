import * as vscode from 'vscode';
import { ConnectionStatus, IConfig } from '../view/app/model';
import { IRefreshCallback } from './IRefreshCallback';
import { ProcessorFactory } from '../repo/processor/ProcessorFactory';

export class DbConnectionUpdater {
    private locked = false;
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
        const connections = this.context.workspaceState.get<{
            [id: string]: IConfig;
        }>('pro-bro.dbconfig');

        if (!connections || Object.keys(connections).length === 0) {
            this.callback.refresh();
            return;
        }

        for (const id of Object.keys(connections)) {
            connections[id].conStatus = ConnectionStatus.Connecting;
            this.updateWorkStateStatus(connections);
            await this.wait();

            const data =
                await ProcessorFactory.getProcessorInstance().getDBVersion(
                    connections[id]
                );

            if (data instanceof Error || 'error' in data) {
                connections[id].conStatus = ConnectionStatus.NotConnected;
            } else {
                connections[id].conStatus = ConnectionStatus.Connected;
            }
            this.updateWorkStateStatus(connections);
        }
    }

    private updateWorkStateStatus(connections: { [id: string]: IConfig }) {
        this.context.workspaceState.update('pro-bro.dbconfig', connections);
        this.callback.refresh();
    }

    private async updateStatuses() {
        const connections = this.context.globalState.get<{
            [id: string]: IConfig;
        }>('pro-bro.dbconfig');

        if (!connections || Object.keys(connections).length === 0) {
            this.callback.refresh();
            return;
        }

        for (const id of Object.keys(connections)) {
            connections[id].conStatus = ConnectionStatus.Connecting;
            this.updateStatus(connections);
            await this.wait();

            const data =
                await ProcessorFactory.getProcessorInstance().getDBVersion(
                    connections[id]
                );

            if (data instanceof Error || 'error' in data) {
                connections[id].conStatus = ConnectionStatus.NotConnected;
            } else {
                connections[id].conStatus = ConnectionStatus.Connected;
            }
            this.updateStatus(connections);
        }
    }

    public async updateSingleConnectionStatusWithRefreshCallback(
        connectionId: string,
        context: vscode.ExtensionContext,
        callback: IRefreshCallback
    ) {
        this.context = context;
        this.callback = callback;

        try {
            if (this.locked === false) {
                this.locked = true;

                if (this.context.globalState) {
                    await this.updateSingleStatus(connectionId, 'globalState');
                }

                if (this.context.workspaceState) {
                    await this.updateSingleStatus(connectionId, 'workspaceState');
                }
            }
        } finally {
            this.locked = false;
        }
    }

    private async updateSingleStatus(
        connectionId: string,
        stateType: 'workspaceState' | 'globalState'
    ) {
        const connections = this.context[stateType].get<{
            [id: string]: IConfig;
        }>('pro-bro.dbconfig');

        if (!connections || !connections[connectionId]) {
            return;
        }

        connections[connectionId].conStatus = ConnectionStatus.Connecting;
        this.updateStatusBasedOnType(connections, stateType);

        await this.wait();

        try {
            const data =
                await ProcessorFactory.getProcessorInstance().getDBVersion(
                    connections[connectionId]
                );
            if (data instanceof Error || 'error' in data) {
                connections[connectionId].conStatus =
                    ConnectionStatus.NotConnected;
            } else {
                connections[connectionId].conStatus =
                    ConnectionStatus.Connected;
            }
        } catch (error) {
            connections[connectionId].conStatus = ConnectionStatus.NotConnected;
        } finally {
            this.updateStatusBasedOnType(connections, stateType);
        }
    }

    private updateStatusBasedOnType(
        connections: { [id: string]: IConfig },
        stateType: 'workspaceState' | 'globalState'
    ) {
        if (stateType === 'workspaceState') {
            this.updateWorkStateStatus(connections);
        } else {
            this.updateStatus(connections);
        }
    }

    private updateStatus(connections: { [id: string]: IConfig }) {
        this.context.globalState.update('pro-bro.dbconfig', connections);
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
