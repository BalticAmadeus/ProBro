import { Constants } from '@src/common/Constants';
import { TableNode } from '@src/treeview/TableNode';

enum CacheKeyNames {
    SelectedColumns = 'selectedColumns',
    AllColumns = 'allColumns',
}

/**
 * Returns selected columns cache values
 * @param node TableNode
 * @returns selected columns cache values
 */
export const getSelectedColumnsCache = (
    node: TableNode | undefined
): string[] => {
    if (!Constants.context || !node) {
        return [];
    }
    return (
        Constants.context.globalState.get<string[]>(
            `${CacheKeyNames.SelectedColumns}.${node.getFullName()}`
        ) ?? []
    );
};

/**
 * Updates selected columns cache values
 * @param node TableNode
 * @param newValueArr new values
 */
export const updateSelectedColumnsCache = (
    node: TableNode | undefined,
    newValueArr: string[]
) => {
    if (!Constants.context || !node) {
        return [];
    }
    Constants.context.globalState.update(
        `${CacheKeyNames.SelectedColumns}.${node.getFullName()}`,
        newValueArr
    );
};

/**
 * Returns all columns cache values
 * @param node TableNode
 * @returns all columns cache values
 */
export const getAllColumnsCache = (node: TableNode | undefined): string[] => {
    if (!Constants.context || !node) {
        return [];
    }
    return (
        Constants.context.globalState.get<string[]>(
            `${CacheKeyNames.AllColumns}.${node.getFullName()}`
        ) ?? []
    );
};

/**
 * Updates all columns cache values
 * @param node TableNode
 * @param newValueArr new values
 */
export const updateAllColumnsCache = (
    node: TableNode | undefined,
    newValueArr: string[]
) => {
    if (!Constants.context || !node) {
        return [];
    }
    Constants.context.globalState.update(
        `${CacheKeyNames.AllColumns}.${node.getFullName()}`,
        newValueArr
    );
};
