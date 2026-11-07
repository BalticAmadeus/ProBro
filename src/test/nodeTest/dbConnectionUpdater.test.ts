import * as assert from 'assert';
import { jest } from '@jest/globals';
import * as vscode from 'vscode';
import { IProcessor } from '../../repo/processor/IProcessor';
import { ProcessorFactory } from '../../repo/processor/ProcessorFactory';
import { DbConnectionUpdater } from '../../treeview/DbConnectionUpdater';
import { IRefreshCallback } from '../../treeview/IRefreshCallback';
import { ConnectionStatus, IConfig } from '../../view/app/model';
import { withSavedItemsLock } from '../../common/SavedItems';

jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: () => ({
            get: () => false,
        }),
    },
}), { virtual: true });

function createConfig(id: string): IConfig {
    return {
        id,
        label: id,
        name: id,
        description: 'from openedge-project.json',
        host: 'localhost',
        port: '1234',
        user: '',
        password: '',
        group: 'Imported',
        params: '',
        connectionId: 'LOCAL',
        type: 0,
        isReadOnly: false,
    };
}

class FakeMemento {
    private state: { [id: string]: IConfig } | undefined;
    private readonly onUpdate?:
        | ((
              value: { [id: string]: IConfig } | undefined,
              updateCount: number,
          ) => { [id: string]: IConfig } | undefined)
        | undefined;
    private updateCount = 0;

    constructor(
        initialState?: { [id: string]: IConfig },
        onUpdate?:
            | ((
                  value: { [id: string]: IConfig } | undefined,
                  updateCount: number,
              ) => { [id: string]: IConfig } | undefined)
            | undefined,
    ) {
        this.state = initialState;
        this.onUpdate = onUpdate;
    }

    public get<T>(_key: string, defaultValue?: T): T | undefined {
        return (this.state as T | undefined) ?? defaultValue;
    }

    public async update(
        _key: string,
        value: { [id: string]: IConfig } | undefined,
    ): Promise<void> {
        this.updateCount += 1;
        this.state = this.onUpdate?.(value, this.updateCount) ?? value;
    }

    public getState() {
        return this.state ?? {};
    }
}

describe('DbConnectionUpdater', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('preserves concurrently added workspace connections during status updates', async () => {
        const firstConnection = createConfig('project1');
        const secondConnection = createConfig('project2');
        const workspaceState = new FakeMemento(
            {
                [firstConnection.id]: firstConnection,
            },
            (value, updateCount) => {
                if (updateCount !== 1 || !value) {
                    return value;
                }

                return {
                    ...value,
                    [secondConnection.id]: secondConnection,
                };
            },
        );
        const globalState = new FakeMemento();
        const context = {
            globalState,
            workspaceState,
        } as unknown as vscode.ExtensionContext;
        const refreshCallback: IRefreshCallback = {
            refresh: jest.fn(),
        };
        const processor: IProcessor = {
            getDBVersion: async () => ({ version: '12.8' }),
            getTablesList: async () => [],
            getTableData: async () => [],
            submitTableData: async () => [],
            getTableDetails: async () => ({
                tableName: '',
                fields: [],
                indexes: [],
            }),
        };

        jest.spyOn(ProcessorFactory, 'getProcessorInstance').mockReturnValue(
            processor,
        );

        const updater = new DbConnectionUpdater();
        Object.assign(updater as object, {
            wait: async () => undefined,
        });

        await updater.updateConnectionStatusesWithRefreshCallback(
            context,
            refreshCallback,
        );

        const finalConnections = workspaceState.getState();
        assert.deepStrictEqual(Object.keys(finalConnections).sort(), [
            'project1',
            'project2',
        ]);
        assert.strictEqual(
            finalConnections.project1.conStatus,
            ConnectionStatus.Connected,
        );
        assert.strictEqual(finalConnections.project2.conStatus, undefined);
    });

    test('serializes status writes with connection reconciliation', async () => {
        const initial = createConfig('initial');
        const added = createConfig('added');
        let observed!: () => void;
        const workspaceRead = new Promise<void>((resolve) => { observed = resolve; });
        class ObservedMemento extends FakeMemento {
            public override get<T>(key: string, defaultValue?: T): T | undefined {
                const result = super.get(key, defaultValue);
                observed();
                return result;
            }
        }
        const workspaceState = new ObservedMemento({ initial });
        const context = {
            globalState: new FakeMemento(),
            workspaceState,
        } as unknown as vscode.ExtensionContext;
        const processor: IProcessor = {
            getDBVersion: async () => ({ version: '12.8' }),
            getTablesList: async () => [],
            getTableData: async () => [],
            submitTableData: async () => [],
            getTableDetails: async () => ({ tableName: '', fields: [], indexes: [] }),
        };
        jest.spyOn(ProcessorFactory, 'getProcessorInstance').mockReturnValue(processor);
        const updater = new DbConnectionUpdater();
        Object.assign(updater as object, { wait: async () => undefined });

        let release!: () => void;
        let entered!: () => void;
        const holding = new Promise<void>((resolve) => { release = resolve; });
        const locked = new Promise<void>((resolve) => { entered = resolve; });
        const reconcile = withSavedItemsLock(async () => {
            const snapshot = workspaceState.getState();
            entered();
            await holding;
            await workspaceState.update('pro-bro.dbconfig', { ...snapshot, added });
        });
        await locked;
        const update = updater.updateConnectionStatusesWithRefreshCallback(
            context, { refresh: jest.fn() },
        );
        await workspaceRead;
        assert.strictEqual(workspaceState.getState().initial.conStatus, undefined);
        release();
        await Promise.all([reconcile, update]);
        assert.strictEqual(workspaceState.getState().initial.conStatus, ConnectionStatus.Connected);
        assert.deepStrictEqual(workspaceState.getState().added, added);
    });
});
