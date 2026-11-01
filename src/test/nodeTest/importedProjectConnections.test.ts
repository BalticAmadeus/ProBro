import * as assert from 'assert';
import { jest } from '@jest/globals';
jest.mock('strip-json-comments', () => ({
    __esModule: true,
    default: (json: string) => json,
}));
import { IConfig } from '../../view/app/model';
import {
    ImportedProject,
    getProjectConnectionIdPrefix,
    importedConnectionDescription,
    loadImportedProjects,
    migrateSavedItems,
    reconcileImportedProjectConnections,
} from '../../common/ImportedProjectConnections';
import { savedItemMatchesConnection } from '../../common/SavedItems';
import { ConnectionStatus } from '../../view/app/model';
import { parseOEFile } from '../../common/OpenEdgeJsonReaded';

function createConfig(id: string, group: string): IConfig {
    return {
        id,
        label: id,
        name: id,
        description: importedConnectionDescription,
        host: 'localhost',
        port: '1234',
        user: '',
        password: '',
        group,
        params: '',
        connectionId: 'LOCAL',
        type: 0,
        isReadOnly: false,
    };
}

describe('imported project connections', () => {
    test('accepts project files without a dbConnections array', () => {
        assert.deepStrictEqual(
            parseOEFile('{"name":"No connections"}', 'C:\\workspace\\openedge-project.json'),
            [],
        );
    });

    test('keeps imported connection IDs stable when connections are reordered', () => {
        const firstOrder = parseOEFile(
            `{
                "name": "Sample",
                "dbConnections": [
                    { "name": "Sports", "connect": "-db sports -H localhost -S 1234" },
                    { "name": "Sales", "connect": "-db sales -H localhost -S 2345" }
                ]
            }`,
            'C:\\workspace\\openedge-project.json',
            { idPrefix: 'local-project-' },
        );
        const reordered = parseOEFile(
            `{
                "name": "Sample",
                "dbConnections": [
                    { "name": "Sales", "connect": "-db sales -H localhost -S 2345" },
                    { "name": "Sports", "connect": "-db sports -H localhost -S 1234" }
                ]
            }`,
            'C:\\workspace\\openedge-project.json',
            { idPrefix: 'local-project-' },
        );

        const firstOrderIds = Object.fromEntries(
            firstOrder.map((config) => [config.label, config.id]),
        );
        const reorderedIds = Object.fromEntries(
            reordered.map((config) => [config.label, config.id]),
        );

        assert.strictEqual(reorderedIds.Sports, firstOrderIds.Sports);
        assert.strictEqual(reorderedIds.Sales, firstOrderIds.Sales);
        assert.match(firstOrderIds.Sports, /^local-project-[a-f0-9]{12}$/);
    });

    test('creates deterministic project-scoped connection ID prefixes', () => {
        const firstPrefix = getProjectConnectionIdPrefix('C:\\workspace\\one\\openedge-project.json');

        assert.strictEqual(
            firstPrefix,
            getProjectConnectionIdPrefix('C:\\workspace\\one\\openedge-project.json'),
        );
        assert.notStrictEqual(
            firstPrefix,
            getProjectConnectionIdPrefix('C:\\workspace\\two\\openedge-project.json'),
        );
    });

    test('retains manual connections while replacing imported project connections', () => {
        const state = reconcileImportedProjectConnections(
            {
                manual: { ...createConfig('manual', 'Manual'), description: 'manual' },
                stale: createConfig('stale', 'First'),
            },
            { first: ['stale'] },
            [{
                source: 'first',
                workspaceFolderName: 'first',
                configs: [createConfig('first-1', 'First')],
            }, {
                source: 'second',
                workspaceFolderName: 'second',
                configs: [createConfig('second-1', 'Second')],
            }],
        );

        assert.deepStrictEqual(Object.keys(state.connections), [
            'manual',
            'first-1',
            'second-1',
        ]);
        assert.deepStrictEqual(state.sources, {
            first: ['first-1'],
            second: ['second-1'],
        });
    });

    test('disambiguates duplicate project names with workspace folder names', () => {
        const state = reconcileImportedProjectConnections(
            {},
            undefined,
            [{
                source: 'first',
                workspaceFolderName: 'service-a',
                configs: [createConfig('first-1', 'Shared')],
            }, {
                source: 'second',
                workspaceFolderName: 'service-b',
                configs: [createConfig('second-1', 'Shared')],
            }],
        );

        assert.strictEqual(
            state.connections['first-1'].group,
            'Shared (service-a)',
        );
        assert.strictEqual(
            state.connections['second-1'].group,
            'Shared (service-b)',
        );
    });

    test('retains prior connections for a broken file while importing other files', () => {
        const old = createConfig('old', 'Old');
        const updated = createConfig('updated', 'Updated');
        const errors: string[] = [];
        const projects = loadImportedProjects([
            { source: 'broken', workspaceFolderName: 'broken', load: () => { throw new Error('invalid'); } },
            { source: 'good', workspaceFolderName: 'good', load: () => [updated] },
        ], { old }, { broken: ['old'] }, (source) => errors.push(source));
        assert.deepStrictEqual(errors, ['broken']);
        assert.deepStrictEqual(projects.map((project) => project.configs), [[old], [updated]]);
    });

    test('retains legacy imports for a broken single project before source metadata exists', () => {
        const old = createConfig('local1', 'Project');
        const manual = { ...createConfig('manual', 'Manual'), description: 'manual' };
        const projects = loadImportedProjects([
            { source: 'broken', workspaceFolderName: 'broken', load: () => { throw new Error('invalid'); } },
        ], { local1: old, manual }, undefined, () => undefined);
        assert.deepStrictEqual(projects[0].configs, [old]);
    });

    test('drops legacy imports of an unreadable file when several files exist', () => {
        const old = createConfig('local1', 'Project');
        const projects = loadImportedProjects([
            { source: 'broken', workspaceFolderName: 'broken', load: () => { throw new Error('invalid'); } },
            { source: 'good', workspaceFolderName: 'good', load: () => [createConfig('new', 'Other')] },
        ], { local1: old }, undefined, () => undefined);
        const state = reconcileImportedProjectConnections({ local1: old }, undefined, projects);
        assert.deepStrictEqual(Object.keys(state.connections), ['new']);
    });

    test('preserves status for unchanged imported connections', () => {
        const old = { ...createConfig('one', 'Project'), conStatus: ConnectionStatus.Connected };
        const state = reconcileImportedProjectConnections(
            { one: old }, { project: ['one'] },
            [{ source: 'project', workspaceFolderName: 'project', configs: [createConfig('one', 'Project')] }],
        );
        assert.strictEqual(state.connections.one.conStatus, ConnectionStatus.Connected);
    });

    test('hides saved items if a manual connection points to a different database', () => {
        const item = { connectionName: 'sports' };
        assert.strictEqual(savedItemMatchesConnection(item, { ...createConfig('one', 'group'), name: 'other' }), false);
        assert.strictEqual(savedItemMatchesConnection(item, { ...createConfig('one', 'group'), name: 'sports' }), true);
    });
});

class FakeState {
    constructor(public data: Record<string, unknown> = {}) {}

    get<T>(key: string, defaultValue: T): T {
        return (this.data[key] === undefined ? defaultValue : this.data[key]) as T;
    }

    async update(key: string, value: unknown): Promise<void> {
        this.data[key] = value;
    }
}

function project(source: string, configs: IConfig[]): ImportedProject {
    return { source, workspaceFolderName: source, configs };
}

const favorite = {
    dbId: 'local1', tableName: 'Customer', tableType: 'UserTable',
    connectionName: 'local1', connectionLabel: 'local1',
};
const view = { ...favorite, name: 'Customers', customViewParams: { filters: ['active'] } };

describe('saved items migration', () => {
    test('maps legacy positions in a single project, including identical connections', async () => {
        const second = { ...favorite, dbId: 'local2', tableName: 'Order' };
        const global = new FakeState({ favorites: [favorite, second], 'custom-views': [view] });
        const workspace = new FakeState({
            'pro-bro.dbconfig': { local1: createConfig('local1', 'P'), local2: createConfig('local2', 'P') },
        });
        const projects = [project('one', [createConfig('new-1', 'P'), createConfig('new-2', 'P')])];

        await migrateSavedItems(global, workspace, projects, undefined);
        const target = (dbId: string) => ({ dbId, connectionName: dbId, connectionLabel: dbId });
        assert.deepStrictEqual(workspace.data.favorites, [
            { ...favorite, ...target('new-1') },
            { ...second, ...target('new-2') },
        ]);
        assert.deepStrictEqual(workspace.data['custom-views'], [{ ...view, ...target('new-1') }]);
        assert.deepStrictEqual(global.data.favorites, [favorite, second]);
    });

    test('remaps changed imported connections in a single project without duplicating on retry', async () => {
        const old = createConfig('old', 'P');
        const workspace = new FakeState({
            'pro-bro.dbconfig': { old },
            favorites: [{ ...favorite, dbId: 'old', connectionName: 'old', connectionLabel: 'old' }],
        });
        const changed = { ...createConfig('new', 'P'), name: 'old', label: 'Renamed', port: '4321' };
        const projects = [project('one', [changed])];
        await migrateSavedItems(new FakeState(), workspace, projects, { one: ['old'] });
        await migrateSavedItems(new FakeState(), workspace, projects, { one: ['old'] });
        assert.deepStrictEqual(workspace.data.favorites, [
            { ...favorite, dbId: 'new', connectionName: 'old', connectionLabel: 'Renamed' },
        ]);
    });

    test('drops unresolved imported items but keeps manual ones', async () => {
        const manual = { ...createConfig('manual', 'Manual'), description: 'manual' };
        const manualFavorite = { ...favorite, dbId: 'manual', connectionName: 'manual', connectionLabel: 'manual' };
        const global = new FakeState({
            'pro-bro.dbconfig': { manual }, favorites: [favorite, manualFavorite], 'custom-views': [view],
        });
        const workspace = new FakeState({ 'pro-bro.dbconfig': { local1: createConfig('local1', 'P') } });

        await migrateSavedItems(global, workspace, [
            project('one', [createConfig('new-1', 'P')]), project('two', [createConfig('new-2', 'P')]),
        ], undefined);
        assert.deepStrictEqual(workspace.data.favorites, [manualFavorite]);
        assert.deepStrictEqual(workspace.data['custom-views'], []);
    });

    test('keeps items of connections that still exist in a multi-project workspace', async () => {
        const kept = { ...favorite, dbId: 'new-1', connectionName: 'new-1', connectionLabel: 'new-1' };
        const workspace = new FakeState({
            'pro-bro.dbconfig': { 'new-1': createConfig('new-1', 'P') },
            favorites: [kept, { ...favorite, dbId: 'gone' }],
        });
        await migrateSavedItems(new FakeState(), workspace, [
            project('one', [createConfig('new-1', 'P')]), project('two', [createConfig('new-2', 'P')]),
        ], { one: ['new-1', 'gone'] });
        assert.deepStrictEqual(workspace.data.favorites, [kept]);
    });

    test('leaves imported items untouched when no projects are available', async () => {
        const workspace = new FakeState({
            'pro-bro.dbconfig': { local1: createConfig('local1', 'P') }, favorites: [favorite],
        });
        await migrateSavedItems(new FakeState(), workspace, [], undefined);
        assert.deepStrictEqual(workspace.data.favorites, [favorite]);
    });

    test('does not restore previously removed workspace items', async () => {
        const global = new FakeState({ favorites: [favorite], 'custom-views': [view] });
        const workspace = new FakeState({
            'pro-bro.dbconfig': { local1: createConfig('local1', 'P') },
            favorites: [], 'custom-views': [],
        });
        await migrateSavedItems(global, workspace, [project('one', [createConfig('new', 'P')])], undefined);
        assert.deepStrictEqual(workspace.data.favorites, []);
        assert.deepStrictEqual(workspace.data['custom-views'], []);
    });
});
