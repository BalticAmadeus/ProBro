import { IConfig, ITableData, TableDetails } from "../../view/app/model";

export interface IProcessor {
  getDBVersion(config: IConfig): Promise<any>;
  getTablesList(config: IConfig): Promise<any>;
  getTableData(
    config: IConfig,
    tableName: string | undefined,
    inputParams: ITableData | undefined
  ): Promise<any>;
  submitTableData(
    config: IConfig,
    tableName: string | undefined,
    inputParams: ITableData | undefined
  ): Promise<any>;
  getTableDetails(
    config: IConfig,
    tableName: string | undefined
  ): Promise<TableDetails>;
}
