import { IDatabaseTablesService } from "../interfaces/IDatabaseTablesService";
import { ITableQueriesService } from "../interfaces/ITableQueriesService";

export class TableQueriesService implements ITableQueriesService {
  public constructor(table: any) {}

  getDatabaseTablesService(): IDatabaseTablesService {
    throw new Error("Method not implemented.");
  }
}
