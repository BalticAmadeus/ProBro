import { IDatabaseTablesService } from "../interfaces/IDatabaseTablesService";
import { IDatabasesService } from "../interfaces/IDatabasesService";
import { ITableQueriesService } from "../interfaces/ITableQueriesService";

export class DatabaseTablesService implements IDatabaseTablesService {
  public constructor(database: any) {}

  getDatabasesService(): IDatabasesService {
    throw new Error("Method not implemented.");
  }
  getTableQueriesService(id: number): ITableQueriesService | undefined {
    throw new Error("Method not implemented.");
  }
  getTableQueriesServices(): ITableQueriesService[] {
    throw new Error("Method not implemented.");
  }
}
