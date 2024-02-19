import { QueryEditor } from '../QueryEditor';

const cache = new Map<string, QueryEditor>();

/**
 * Gets the QueryEditor instance associated with a given table name.
 * @param tableName The name of the table for which to retrieve the QueryEditor.
 * @returns The QueryEditor instance if found; undefined otherwise.
 */
export const getQueryEditor = (tableName: string): QueryEditor | undefined => {
    return cache.get(tableName);
};

/**
 * Sets or updates the QueryEditor instance associated with a given table name.
 * If a QueryEditor for the table already exists, it will be replaced.
 * @param tableName The name of the table for which to set the QueryEditor.
 * @param queryEditor The QueryEditor instance to associate with the table name.
 */
export const setQueryEditor = (
    tableName: string,
    queryEditor: QueryEditor
): void => {
    cache.set(tableName, queryEditor);
};

/**
 * Removes the QueryEditor instance associated with a given table name from the cache.
 * @param tableName The name of the table for which to remove the QueryEditor.
 */
export const removeQueryEditor = (tableName: string): void => {
    cache.delete(tableName);
};

export const queryEditorCache = {
    getQueryEditor,
    setQueryEditor,
    removeQueryEditor,
};
