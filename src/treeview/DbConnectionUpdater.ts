import * as vscode from "vscode";
import { DatabaseProcessor } from "../db/DatabaseProcessor";
import { IConfig } from "../view/app/model";
import { IRefreshCallback, RefreshWithoutCallback } from "./IRefreshCallback";

export class DbConnectionUpdater {
    constructor (){}

    public async updateConnectionStatuses (context: vscode.ExtensionContext) {
        this.updateConnectionStatusesWithRefreshCallback(context, new RefreshWithoutCallback());
    }

    public async updateConnectionStatusesWithRefreshCallback (context: vscode.ExtensionContext, refreshCallback: IRefreshCallback) {
        let connections = context.globalState.get<{ [id: string]: IConfig }>(`pro-bro.dbconfig`);

        if (connections && Object.keys(connections).length !== 0) {
            for (let id of Object.keys(connections)) {   
                await DatabaseProcessor.getInstance().getDBVersion(connections[id]).then((data) => {
                    connections![id].conStatus = data.error ? false : true;
                    });;
                context.globalState.update(`pro-bro.dbconfig`, connections);
                refreshCallback.refresh();
            }
        }
    }

}