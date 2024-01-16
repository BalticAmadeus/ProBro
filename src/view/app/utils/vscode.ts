import { ICommand } from '@app/model';

/**
 * Active interface for vscode api variable
 */
export interface VSCode {
    postMessage(messageCommand: ICommand): void;
    getState(): any;
    setState(state: any): void;
}

let vsCodeAPI: VSCode = null;

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
