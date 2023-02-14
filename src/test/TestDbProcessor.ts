import { IDbProcessor } from "../db/IDbProcessor";
import { IOEParams } from "../db/oe";
import { IConfig, ITableData, TableDetails } from "../view/app/model";

export class TestDbProcessor implements IDbProcessor {

    public returnValue: any;

    constructor(returnVal:any) {
        this.returnValue = returnVal;
    }

    public getDBVersion(config: IConfig): Promise<any>{
        return Promise.resolve(this.returnValue);
    };

    public getTablesList(config: IConfig): Promise<any>{
        return Promise.resolve(this.returnValue);
    };

    public getTableData(config: IConfig, tableName: string | undefined, inputParams: ITableData | undefined): Promise<any>{
        return Promise.resolve(this.returnValue);
    };

    public submitTableData(config: IConfig, tableName: string | undefined, inputParams: ITableData | undefined): Promise<any>{
        return Promise.resolve(this.returnValue);
    };

    public getTableDetails(config: IConfig | undefined, tableName: string | undefined): Promise<TableDetails>{
        return Promise.resolve(this.returnValue);
    };
}