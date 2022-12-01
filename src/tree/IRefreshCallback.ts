import * as vscode from "vscode";

export interface IRefreshCallback {
    refresh(): void;
}

export class RefreshWithoutCallback implements IRefreshCallback {
    refresh(): void {
    }
}
