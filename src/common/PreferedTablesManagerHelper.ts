import { TableDetails } from '../view/app/model';
import { FieldRow } from '../view/app/model';

export class PreferedTablesManagerHelper{

    private static instance: PreferedTablesManagerHelper;

    public static getInstance(): PreferedTablesManagerHelper {
        if (this.instance === null || this.instance === undefined) {
            this.instance = new PreferedTablesManagerHelper();
        }
        return this.instance;
    }

    private selectedRows :Set<number>;

    private constructor() {
        console.log("CONSTRUCTOR HELPER");
        this.selectedRows = new Set();
    }

    public setSelectedRows(tableDetails: TableDetails){
        //this.selectedRows.clear();

        const selectedColumns: string[] | undefined= tableDetails.selectedColumns;

        if (selectedColumns !== undefined){
            tableDetails.fields.forEach((element) => {
                if (selectedColumns.includes(element.name)){
                    this.selectedRows.add(element.order);
                }
            });
        }
        console.log("SELECTED ROWS IN SET", [...this.selectedRows]);
    }

    public async getSelectedRows(): Promise<Set<number>>{
        console.log("getSelectedRows", [...this.selectedRows]);
        return this.selectedRows;
    }

}