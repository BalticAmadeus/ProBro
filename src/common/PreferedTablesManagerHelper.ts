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

    public setSelectedRows(setas: Set<number>){
        this.selectedRows = new Set(setas);
        console.log("DATA IS SAVED NOW");
    }

    public getSelectedRows(): Set<number>{
        console.log("DATA IS RETURNED NOW");
        return new Set(this.selectedRows);
    }

}