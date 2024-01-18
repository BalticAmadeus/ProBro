import { ICommand } from '@app/model';
import { ISettings } from '@src/common/IExtensionSettings';

/**
 * Active interface for vscode api variable
 */
export interface VSCode {
    postMessage(messageCommand: ICommand): void;
    getState(): any;
    setState(state: any): void;
}

let vsCodeAPI: VSCode = undefined;
let configuration: ISettings = undefined;

/**
 * method that returns the vsCodeAPI
 * note: the window.acquireVsCodeApi may only be called once.
 * @returns vsCodeAPI
 */
export const getVSCodeAPI = () => {
    if (!vsCodeAPI) {
        vsCodeAPI = window.acquireVsCodeApi() as VSCode;
    }
    return vsCodeAPI;
};

/**
 * method that returns the vscode configuration
 * @returns configuration
 */
export const getVSCodeConfiguration = () => {
    if (!configuration) {
        configuration = window.configuration;
    }
    return configuration;
};
