import * as vscode from "vscode";
import { IConfig, TableDetails } from "../view/app/model";
import { IProcessor } from "./IProcessor";
import * as cp from "child_process";
import { IOEParams, IOETableData, IOETablesList, IOEVersion } from "./oe";

export class DatabaseProcessor implements IProcessor {
    public execShell(cmd: string) {
        console.log(cmd);
        return new Promise<string>((resolve, reject) => {
            cp.exec(cmd, (err, out) => {
                if (err) {
                    console.log("STDERR: ", err);
                    return reject(err);
                }
                return resolve(out);
            });
        }).then((data) => {
            //console.log("output data: ", data)
            return JSON.parse(data);
        });
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

    public getTableData(config: IConfig, tableName: string | undefined, wherePhrase: string, start: number, pageLength: number): Promise<IOETableData> {
        if (config && tableName) {
            var params: IOEParams = {
                connectionString: this.getConnectionString(config),
                command: "get_table_data",
                params: { tableName: tableName, wherePhrase: wherePhrase, start: start, pageLength: pageLength }
            }
            const cmd = `${this.context.extensionPath}/resources/oe/oe.bat -b -p "${this.context.extensionPath}/resources/oe/oe.p" -param "${Buffer.from(JSON.stringify(params)).toString('base64')}"`;
            return this.execShell(cmd);
        } else {
            return new Promise(resolve => { return { columns: [], data: [] } });
        }
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
