import { IDatabaseTablesService } from "./IDatabaseTablesService";

export interface ITableQueriesService {
  getDatabaseTablesService(): IDatabaseTablesService;
}
