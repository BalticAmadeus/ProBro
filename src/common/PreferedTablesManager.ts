import { TableDetails } from '../view/app/model';
import * as vscode from 'vscode';
import { PreferedTablesManagerHelper } from './PreferedTablesManagerHelper';

export class PreferedTablesManager{

    private static instance: PreferedTablesManager;
    private context: vscode.ExtensionContext;
    private savedTables: Map<string, Set<SavedRow>>;

    public static getInstance(context: vscode.ExtensionContext): PreferedTablesManager {
        if (this.instance === null || this.instance === undefined) {
            this.instance = new PreferedTablesManager(context);
        }
        return this.instance;
    }

    private constructor(context: vscode.ExtensionContext) {
        console.log("CONSTRUCTOR MANAGER");
        this.context = context;
        this.savedTables = new Map<string, Set<SavedRow>>();
        this.loadAllSavedRows();
    }

    public async saveOnClick(tableName: string, tableNode: TableDetails) {
        const selectedColumns: string[] = tableNode.selectedColumns!;
        let rows: Set<SavedRow> = new Set<SavedRow>;

        tableNode.fields.forEach((field) =>{
            if (selectedColumns.includes(field.name)){
                const row : SavedRow= {
                    name: field.name,
                    order: field.order
                };
                rows.add(row);
            }
        });
        this.savedTables.set(tableName, rows);

        const json = this.mapToJson();
        this.context.globalState.update(`pro-bro.savedTablesKey`, json);
    }

    private mapToJson(){
        let obj: {[key: string]: SavedRow[]} = {};
        for (const [key, value] of this.savedTables.entries()){
            obj[key] = Array.from(value);
        }
        return JSON.stringify(obj);
    }

    private loadAllSavedRows() {
        let savedTablesString: string = this.context.globalState.get<string>(`pro-bro.savedTablesKey`)!;
        
        const parsedTables: { [key: string]: { name: string; order: number }[] } = JSON.parse(savedTablesString);
        for (const [tableName, rows] of Object.entries(parsedTables)) {
            const rowsSet = new Set<SavedRow>();
            for (const { name, order } of rows) {
                rowsSet.add({ name, order });
            }
            this.savedTables.set(tableName, rowsSet);
        }
    
        const json = this.mapToJson();
        console.log("jsonas: ", json);
    }

    public saveTableSelectedRows(tableName: string){
        const preferedTablesManagerHelper = PreferedTablesManagerHelper.getInstance();

        let tmpSet: Set<number> = new Set<number>();
        const savedRows = this.savedTables.get(tableName);
        savedRows?.forEach((row) =>{
            tmpSet.add(row.order);
        });
        preferedTablesManagerHelper.setSelectedRows(tmpSet);
    }

}

interface SavedTables{
    tableName: string,
    savedRows: Set<SavedRow>
}

interface SavedRow{
    name: string,
    order: number
}