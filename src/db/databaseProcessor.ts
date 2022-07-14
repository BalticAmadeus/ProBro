import * as vscode from "vscode";
import { IConfig, TableDetails } from "../view/app/model";
import { IProcessor } from "./IProcessor";
import * as cp from "child_process";
import { IOEParams, IOETablesList, IOEVersion } from "./oe";

export class DatabaseProcessor implements IProcessor {
    public execShell(cmd: string) {
        return new Promise<string>((resolve, reject) => {
            cp.exec(cmd, (err, out) => {
                console.log(out, err);
                if (err) {
                    return reject(err);
                }
                return resolve(out);
            });
        }).then((data) => { return JSON.parse(data); });
    }

    constructor(private context: vscode.ExtensionContext) {
    }

    private getConnectionString(config: IConfig) {
        var connectionString = `-db ${config.name} ${config.user ? '-U ' + config.user : ''} ${config.password ? '-P ' + config.password : ''} ${config.host ? '-H ' + config.host : ''} ${config.port ? '-S ' + config.port : ''}`;
        return connectionString;
    }

    public getDBVersion(config: IConfig): Promise<IOEVersion> {
        var params: IOEParams = {
            connectionString: this.getConnectionString(config),
            command: "get_version"
        }
        console.log(params.connectionString)
        const cmd = `${this.context.extensionPath}/resources/oe/oe.bat -b -p "${this.context.extensionPath}/resources/oe/oe.p" -param "${Buffer.from(JSON.stringify(params)).toString('base64')}"`;
        return this.execShell(cmd);
    }

    public getTablesList(config: IConfig): Promise<IOETablesList> {
        var params: IOEParams = {
            connectionString: this.getConnectionString(config),
            command: "get_tables"
        }
        const cmd = `${this.context.extensionPath}/resources/oe/oe.bat -b -p "${this.context.extensionPath}/resources/oe/oe.p" -param "${Buffer.from(JSON.stringify(params)).toString('base64')}"`;
        return this.execShell(cmd);
    }

    public getTableDetails(config: IConfig | undefined, tableName: string | undefined): Promise<TableDetails> {
        if (config && tableName) {
            var params: IOEParams = {
                connectionString: this.getConnectionString(config),
                command: "get_table_details",
                params: tableName
            }
            const cmd = `${this.context.extensionPath}/resources/oe/oe.bat -b -p "${this.context.extensionPath}/resources/oe/oe.p" -param "${Buffer.from(JSON.stringify(params)).toString('base64')}"`;
            return this.execShell(cmd);
        } else {
            return new Promise(resolve => { return { fields: [], indexes: [] } });
        }
    }

}
