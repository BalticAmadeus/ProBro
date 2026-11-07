import * as vscode from 'vscode';
import { ConnectionStatus, IConfig } from '../view/app/model';
import { IRefreshCallback } from './IRefreshCallback';
import { ProcessorFactory } from '../repo/processor/ProcessorFactory';
import { withSavedItemsLock } from '../common/SavedItems';

type StateType = 'workspaceState' | 'globalState';

export class DbConnectionUpdater {
    private static readonly dbConfigKey = 'pro-bro.dbconfig';
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
                await this.updateStatusesForState('globalState');
                await this.updateStatusesForState('workspaceState');
            }
        } finally {
            this.locked = false;
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
                    await this.updateStatus(connectionId, 'globalState');
                }

                if (this.context.workspaceState) {
                    await this.updateStatus(connectionId, 'workspaceState');
                }
            }
        } finally {
            this.locked = false;
        }
    }

    private async updateStatus(
        connectionId: string,
        stateType: StateType
    ) {
        if (!this.getConnection(stateType, connectionId)) {
            return;
        }

        await this.setConnectionStatus(
            stateType,
            connectionId,
            ConnectionStatus.Connecting
        );
        await this.wait();

        let status = ConnectionStatus.NotConnected;
        try {
            const connection = this.getConnection(stateType, connectionId);
            if (!connection) {
                return;
            }
            const data =
                await ProcessorFactory.getProcessorInstance().getDBVersion(
                    connection
                );
            if (!(data instanceof Error || 'error' in data)) {
                status = ConnectionStatus.Connected;
            }
        } catch (error) {
            // a failed version check leaves the connection as not connected
        }
        await this.setConnectionStatus(stateType, connectionId, status);
    }

    private async updateStatusesForState(stateType: StateType) {
        const ids = Object.keys(this.getConnections(stateType) ?? {});
        if (ids.length === 0) {
            this.callback.refresh();
            return;
        }

        for (const id of ids) {
            await this.updateStatus(id, stateType);
        }
    }

    private getConnections(stateType: StateType) {
        return this.context[stateType].get<{
            [id: string]: IConfig;
        }>(DbConnectionUpdater.dbConfigKey);
    }

    private getConnection(
        stateType: StateType,
        connectionId: string
    ): IConfig | undefined {
        return this.getConnections(stateType)?.[connectionId];
    }

    private setConnectionStatus(
        stateType: StateType,
        connectionId: string,
        conStatus: ConnectionStatus
    ): Promise<void> {
        return withSavedItemsLock(async () => {
            const connections = this.getConnections(stateType);
            const connection = connections?.[connectionId];

            if (connections && connection) {
                await this.context[stateType].update(
                    DbConnectionUpdater.dbConfigKey,
                    {
                        ...connections,
                        [connectionId]: { ...connection, conStatus },
                    }
                );
            }
            this.callback.refresh();
        });
    }

    private wait(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 250);
        });
    }
}
