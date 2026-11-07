import { createHash } from 'crypto';
import { IConfig } from '../view/app/model';
import { SavedTable, StateStore } from './SavedItems';

export const importedConnectionDescription = 'from openedge-project.json';

export interface ImportedProject {
    source: string;
    workspaceFolderName: string;
    configs: IConfig[];
    // Keep ownership metadata for saved items while the source cannot be read.
    failedConnectionIds?: string[];
}

export interface ImportedConnectionSources {
    [source: string]: string[];
}

export interface ImportedConnectionState {
    connections: { [id: string]: IConfig };
    sources: ImportedConnectionSources;
}

export function getProjectConnectionIdPrefix(source: string): string {
    return `local-${normalizeImportedIdSegment(source)}-`;
}

export function reconcileImportedProjectConnections(
    existingConnections: { [id: string]: IConfig },
    previousSources: ImportedConnectionSources | undefined,
    projects: ImportedProject[],
): ImportedConnectionState {
    const importedIds = new Set(
        previousSources
            ? Object.values(previousSources).flat()
            : Object.entries(existingConnections)
                .filter(([, config]) =>
                    config.description === importedConnectionDescription,
                )
                .map(([id]) => id),
    );
    const connections = Object.fromEntries(
        Object.entries(existingConnections).filter(
            ([id]) => !importedIds.has(id),
        ),
    );
    const projectNameCounts = new Map<string, number>();

    for (const project of projects) {
        const projectName = project.configs[0]?.group ?? '';
        projectNameCounts.set(
            projectName,
            (projectNameCounts.get(projectName) ?? 0) + 1,
        );
    }

    const sources: ImportedConnectionSources = {};
    for (const project of projects) {
        const projectName = project.configs[0]?.group ?? '';
        const group =
            projectNameCounts.get(projectName) === 1
                ? projectName
                : `${projectName} (${project.workspaceFolderName})`;

        sources[project.source] = project.failedConnectionIds ??
            project.configs.map((config) => config.id);
        for (const config of project.configs) {
            connections[config.id] = {
                ...config,
                group,
                conStatus: existingConnections[config.id]?.conStatus,
            };
        }
    }

    return { connections, sources };
}

export function loadImportedProjects(
    inputs: { source: string; workspaceFolderName: string; load: () => IConfig[] }[],
    previousConnections: { [id: string]: IConfig },
    previousSources: ImportedConnectionSources | undefined,
    reportError: (source: string, error: unknown) => void,
): ImportedProject[] {
    return inputs.map(({ source, workspaceFolderName, load }) => {
        try {
            return { source, workspaceFolderName, configs: load() };
        } catch (error) {
            reportError(source, error);
            const previousIds = previousSources?.[source] ??
                (!previousSources && inputs.length === 1
                    ? Object.keys(previousConnections).filter((id) =>
                        previousConnections[id].description === importedConnectionDescription)
                    : []);
            return {
                source,
                workspaceFolderName,
                configs: [],
                failedConnectionIds: previousIds,
            };
        }
    });
}

export function createImportedConnectionId(
    idPrefix: string,
    config: IConfig,
    occurrence = 1,
): string {
    const normalizedPrefix = idPrefix.endsWith('-') ? idPrefix : `${idPrefix}-`;
    const baseId = createHash('sha256')
        .update(getImportedConnectionIdentityKey(config))
        .digest('hex')
        .slice(0, 12);

    return occurrence === 1
        ? `${normalizedPrefix}${baseId}`
        : `${normalizedPrefix}${baseId}-${occurrence}`;
}

export function getImportedConnectionIdentityKey(config: IConfig): string {
    return JSON.stringify({
        label: config.label.trim(),
        name: config.name.trim(),
        host: config.host.trim(),
        port: config.port.trim(),
        user: config.user.trim(),
        params: config.params.trim(),
        isReadOnly: config.isReadOnly,
    });
}

/**
 * Moves favorites and custom views to the workspace state and re-points the ones
 * saved for previously imported connections to the freshly imported ones.
 * Imported items can only be remapped when the workspace has a single project;
 * with several projects they are dropped, as they cannot be attributed reliably.
 */
export async function migrateSavedItems(
    globalState: StateStore,
    workspaceState: StateStore,
    projects: ImportedProject[],
    sources: ImportedConnectionSources | undefined,
): Promise<void> {
    type SavedItem = SavedTable & { name?: string };
    const oldConnections = workspaceState.get<{ [id: string]: IConfig }>(
        'pro-bro.dbconfig', {},
    );
    const manualConnections = globalState.get<{ [id: string]: IConfig }>(
        'pro-bro.dbconfig', {},
    );
    const importedIds = new Set([
        ...Object.values(sources ?? {}).flat(),
        ...Object.entries(oldConnections)
            .filter(([, config]) => config.description === importedConnectionDescription)
            .map(([id]) => id),
    ]);
    const newConnections = projects.flatMap((project) => project.configs);
    const failedIds = new Set(
        projects.flatMap((project) => project.failedConnectionIds ?? []),
    );
    const hasFailedProject = projects.some(
        (project) => project.failedConnectionIds !== undefined,
    );

    function singleProjectTarget(dbId: string): IConfig | undefined {
        if (projects.length !== 1) {
            return undefined;
        }
        const legacy = /^local([1-9]\d*)$/.exec(dbId);
        if (legacy) {
            return newConnections[Number(legacy[1]) - 1];
        }
        const old = oldConnections[dbId];
        const unique = (matches: (config: IConfig) => boolean) => {
            const found = newConnections.filter(matches);
            return found.length === 1 ? found[0] : undefined;
        };
        return old && (
            unique((config) =>
                getImportedConnectionIdentityKey(config) ===
                    getImportedConnectionIdentityKey(old)) ??
            unique((config) => config.name === old.name)
        );
    }

    for (const key of ['favorites', 'custom-views'] as const) {
        const stored = workspaceState.get<SavedItem[] | undefined>(key, undefined);
        const items = stored ?? globalState.get<SavedItem[]>(key, []);
        const result: SavedItem[] = [];
        const seen = new Set<string>();

        for (const item of items) {
            const manual = manualConnections[item.dbId];
            const isManual = manual?.name === item.connectionName &&
                manual?.label === item.connectionLabel;
            const isImported = !isManual &&
                (importedIds.has(item.dbId) || /^local[1-9]\d*$/.test(item.dbId));
            let config = newConnections.find((connection) => connection.id === item.dbId);
            const awaitingFailedProject = failedIds.has(item.dbId) ||
                (hasFailedProject && /^local[1-9]\d*$/.test(item.dbId));
            if (!config && isImported && projects.length > 0 && !awaitingFailedProject) {
                config = singleProjectTarget(item.dbId);
                if (!config) {
                    continue;
                }
            }

            const migrated = config
                ? { ...item, dbId: config.id, connectionName: config.name, connectionLabel: config.label }
                : item;
            const itemKey = JSON.stringify([
                migrated.dbId, migrated.tableName, migrated.connectionName,
                key === 'custom-views' ? migrated.name : undefined,
            ]);
            if (!seen.has(itemKey)) {
                seen.add(itemKey);
                result.push(migrated);
            }
        }

        if (!stored || JSON.stringify(stored) !== JSON.stringify(result)) {
            await workspaceState.update(key, result);
        }
    }
}

function normalizeImportedIdSegment(value: string): string {
    const normalizedValue = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalizedValue || 'empty';
}
