import * as vscode from 'vscode';
import { Constants } from './../../../common/Constants';


export class VersionChecker{

    private readonly pjson = require('./../../../../package.json');
    public versionFromPackage: string = this.pjson.version;
    private lastSeenVesion: string | null = this.context.globalState.get(`${Constants.globalExtensionKey}-version`)?? null;

    constructor(private context: vscode.ExtensionContext){ }

    public isNewVersion(): boolean{

        if (this.lastSeenVesion  === null || this.lastSeenVesion !== this.versionFromPackage){
            this.context.globalState.update(`${Constants.globalExtensionKey}-version`, this.versionFromPackage);
            return true;
        }
        return false;
    }

    public forDebug(): boolean{
        this.isNewVersion();
        return true;
    }
}