import * as vscode from 'vscode';
import { IConfig } from '../../view/app/model';
import { Constants } from '../../common/Constants';

const configStateKey = `${Constants.globalExtensionKey}.dbconfig`;

const getMergedConfigs = (
    context: vscode.ExtensionContext,
): { [key: string]: IConfig } => {
    const mergedConfigs: { [key: string]: IConfig } = {};

    const workspaceConfigs = context.workspaceState.get<{
		[key: string]: IConfig;
	}>(configStateKey);
    const globalConfigs = context.globalState.get<{
		[key: string]: IConfig;
	}>(configStateKey);

    if (workspaceConfigs) {
        Object.assign(mergedConfigs, workspaceConfigs);
    }

    if (globalConfigs) {
        Object.assign(mergedConfigs, globalConfigs);
    }

    return mergedConfigs;
};

export const ConfigStore = {
    getAllConfigs: (
        context: vscode.ExtensionContext,
    ): IConfig[] | undefined => {
        const mergedConfigs = getMergedConfigs(context);

        if (Object.keys(mergedConfigs).length === 0) {
            return undefined;
        }

        return Object.keys(mergedConfigs).map((key) => mergedConfigs[key]);
    },
    getConfigById: (
        context: vscode.ExtensionContext,
        id: string,
    ): IConfig | undefined => {
        const mergedConfigs = getMergedConfigs(context);
        return mergedConfigs[id];
    },
    setGlobalConfigs: async (
        context: vscode.ExtensionContext,
        configs: { [key: string]: IConfig } | undefined,
    ) => {
        await context.globalState.update(
            configStateKey,
            configs,
        );
    },
};
