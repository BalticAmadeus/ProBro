import * as vscode from "vscode";
import { IConfig } from "../view/app/model";
import { IProcessor } from "./IProcessor";
import * as cp from "child_process";
import { IOETablesList, IOEVersion } from "./oe";

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

    public getDBVersion(config: IConfig): Promise<IOEVersion> {
        console.log(config);
        const cmd = `${this.context.extensionPath}/resources/oe/oe.bat -1 -b -RO -db ${config.name} -p "${this.context.extensionPath}/resources/oe/getversion.p"`;
        console.log(cmd);
        return this.execShell(cmd);
    }

    public getTablesList(config: IConfig): Promise<IOETablesList> {
        const cmd = `${this.context.extensionPath}/resources/oe/oe.bat -1 -b -RO -db ${config.name} -p "${this.context.extensionPath}/resources/oe/gettables.p"`;
        console.log(cmd);
        return this.execShell(cmd);
    }
}
