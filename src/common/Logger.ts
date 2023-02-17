import * as vscode from "vscode";

export class Logger{

    private readonly configuration = vscode.workspace.getConfiguration("ProBro");

    constructor (){
    }

    log(message: string, additionalData: any): void{
        if (this.configuration.get("logging.node")){
            console.log(message, additionalData);
        }
    }
}