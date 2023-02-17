import * as vscode from "vscode";

export class Logger{

    private readonly doLog: boolean;

    constructor (logPart: string){
        this.doLog = vscode.workspace.getConfiguration("ProBro").get(`logging.${logPart}`)!;
        console.log("logger.ts", this.doLog, logPart);
    }

    log(message: string, additionalData: any): void{
        if (this.doLog){
            console.log(message, additionalData);
        }
    }
}