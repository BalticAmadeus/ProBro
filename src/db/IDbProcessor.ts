import { IConfig, ITableData, TableDetails } from "../view/app/model";
import { IOEParams } from "./oe";

export interface IDbProcessor {
    execShell(params: IOEParams): Promise<any>;
    getDBVersion(config: IConfig): Promise<any>;
    getTablesList(config: IConfig): Promise<any>
    getTableData(config: IConfig, tableName: string | undefined, inputParams: ITableData | undefined): Promise<any>;
    submitTableData(config: IConfig, tableName: string | undefined, inputParams: ITableData | undefined): Promise<any>;
    getTableDetails(config: IConfig | undefined, tableName: string | undefined): Promise<TableDetails>;
}
