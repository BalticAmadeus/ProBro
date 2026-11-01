import { ICustomView, IConfig } from '../view/app/model';

export interface SavedTable {
    dbId: string;
    tableName: string;
    tableType: string;
    connectionName: string;
    connectionLabel: string;
}

export interface SavedCustomView extends SavedTable {
    name: string;
    customViewParams: ICustomView | undefined;
}

export interface StateStore {
    get<T>(key: string, defaultValue: T): T;
    update(key: string, value: unknown): Thenable<void>;
}

let savedItemsQueue: Promise<void> = Promise.resolve();

export function withSavedItemsLock<T>(update: () => Promise<T>): Promise<T> {
    const result = savedItemsQueue.then(update);
    savedItemsQueue = result.then(
        () => undefined,
        () => undefined,
    );
    return result;
}

/**
 * Applies `update` to the list stored under `key` while holding the saved items lock.
 * Returns false without writing when `update` returns undefined.
 */
export function updateSavedItems<T>(
    state: StateStore,
    key: string,
    update: (items: T[]) => T[] | undefined,
): Promise<boolean> {
    return withSavedItemsLock(async () => {
        const items = update(state.get<T[]>(key, []));
        if (!items) {
            return false;
        }
        await state.update(key, items);
        return true;
    });
}

export function savedItemMatchesConnection(
    item: { connectionName: string },
    config: IConfig | undefined,
): boolean {
    return config?.name === item.connectionName;
}
