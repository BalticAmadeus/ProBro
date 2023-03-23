import * as fs from 'fs';
import { TableDetails } from '../view/app/model';

export class PreferedTablesManager{

    private static instance: PreferedTablesManager;

    public static getInstance(): PreferedTablesManager {
        if (this.instance === null || this.instance === undefined) {
            this.instance = new PreferedTablesManager();
        }
        return this.instance;
    }

    private allPreferences: Map<string, TableDetails>;

    private constructor() {
        console.log("CONSTRUCTOR MANAGER");
        this.allPreferences = new Map<string, TableDetails>();
        this.loadAllPreferences();
    }

    private filePath: string = "C:/Workspaces/TempFiles/savedPreferences.json";

    

    public async savePreferences(tableName: string, tableNode: TableDetails) {
        if (tableNode.selectedColumns !== undefined) {
        this.allPreferences.set(tableName, tableNode);
        const jsonString = JSON.stringify([...this.allPreferences.entries()]);
        fs.writeFileSync(this.filePath, jsonString);
        }
    }

    private loadAllPreferences() {
        try{
            const jsonString = fs.readFileSync(this.filePath, 'utf8');
            const entries = JSON.parse(jsonString);
            this.allPreferences = new Map(entries);
            console.log("LOADED", [...this.allPreferences.entries()]);
        } catch {
            
        }
    }

    public sendLoadedPreferences(tableName: string){
        const selectedColumns: TableDetails | undefined = this.allPreferences.get(tableName);
        if (selectedColumns !== undefined) {
            return selectedColumns;
        }
        return undefined;
    }


}