import { IDatabasesService } from "./IDatabasesService";
import { ITableQueriesService } from "./ITableQueriesService";

export interface IDatabaseTablesService {
  getDatabasesService(): IDatabasesService;
  getTableQueriesService(id: number): ITableQueriesService | undefined;
  getTableQueriesServices(): ITableQueriesService[];
}
