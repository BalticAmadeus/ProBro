import { IProcessor } from "../IProcessor";
import { IConfig, ITableData, TableDetails } from "../../../view/app/model";

export class DBProcessor implements IProcessor {
  private static instance: DBProcessor | undefined; // singleton

  private constructor() {}

  public static getInstance(): DBProcessor {
    if (DBProcessor.instance === undefined) {
      DBProcessor.instance = new DBProcessor();
    }

    return DBProcessor.instance;
  }

  getDBVersion(config: IConfig): Promise<any> {
    throw new Error("Method not implemented.");
  }

  getTablesList(config: IConfig): Promise<any> {
    throw new Error("Method not implemented.");
  }

  getTableData(
    config: IConfig,
    tableName: string | undefined,
    inputParams: ITableData | undefined
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }

  submitTableData(
    config: IConfig,
    tableName: string | undefined,
    inputParams: ITableData | undefined
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }

  getTableDetails(
    config: IConfig,
    tableName: string | undefined,
    inputParams: ITableData | undefined
  ): Promise<TableDetails> {
    throw new Error("Method not implemented.");
  }
}
