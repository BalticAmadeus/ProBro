import { IConfig, ITableData, TableDetails } from '../../view/app/model';

export interface IProcessor {
  getDBVersion(config: IConfig): Promise<any>;
  getTablesList(config: IConfig): Promise<any>;
  getTableData(
    config: IConfig | undefined,
    tableName: string | undefined,
    inputParams: ITableData | undefined
  ): Promise<any>;
  submitTableData(
    config: IConfig | undefined,
    tableName: string | undefined,
    inputParams: ITableData | undefined
  ): Promise<any>;
  getTableDetails(
    config: IConfig | undefined,
    tableName: string | undefined
  ): Promise<TableDetails>;
}
