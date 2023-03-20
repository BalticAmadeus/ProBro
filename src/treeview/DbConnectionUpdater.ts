import * as vscode from "vscode";
import { DatabaseProcessor } from "../db/DatabaseProcessor";
import { ConnectionStatus, IConfig } from "../view/app/model";
import { IRefreshCallback, RefreshWithoutCallback } from "./IRefreshCallback";

export class DbConnectionUpdater {
    constructor (){}
    private locked: boolean = false;
    private allLoaded:boolean = false;

    public async updateConnectionStatuses (context: vscode.ExtensionContext) {
        this.updateConnectionStatusesWithRefreshCallback(context, new RefreshWithoutCallback());
    }

    public async updateConnectionStatusesWithRefreshCallback (context: vscode.ExtensionContext, refreshCallback: IRefreshCallback) {
        if (this.locked === false){
            this.locked = true;
            let connections = context.globalState.get<{ [id: string]: IConfig }>(`pro-bro.dbconfig`);

            await this.updateStatuses(connections,context,refreshCallback);

            while (!this.checkIfAllLoaded(connections)) {
                await this.updateStatuses(connections, context, refreshCallback);
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            this.locked = false;
        }
    }

    private async updateStatuses(connections: {[id: string]: IConfig } | undefined, context: vscode.ExtensionContext, refreshCallback: IRefreshCallback){

        if (connections && Object.keys(connections).length !== 0) {
            for (let id of Object.keys(connections)) {
                connections![id].conStatus = ConnectionStatus.Connecting;
                await context.globalState.update(`pro-bro.dbconfig`, connections).then( () => {
                    refreshCallback.refresh();
                });
                try{
                    await DatabaseProcessor.getInstance().getDBVersion(connections[id]).then((data) => {
                        if (data instanceof Error) {
                            throw new Error("Processor is busy!");
                        }
                        else{
                            connections![id].conStatus = ("error" in data) ? ConnectionStatus.NotConnected : ConnectionStatus.Connected;
                            console.log("DATACONN", data);
                            context.globalState.update(`pro-bro.dbconfig`, connections);
                            refreshCallback.refresh();
                        }
                    });
                }
                catch{
                    break;
                }
            }
        }
    }

    private checkIfAllLoaded(connections: {[id: string]: IConfig } | undefined): boolean{
        this.allLoaded = true;
        if (connections && Object.keys(connections).length !== 0) {
            for (let id of Object.keys(connections)) {
                if (connections![id].conStatus === ConnectionStatus.Connecting){
                    this.allLoaded = false;
                    break;
                }
            }
        }
        return this.allLoaded;
    }

}