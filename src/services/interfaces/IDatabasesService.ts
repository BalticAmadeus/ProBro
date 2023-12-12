import { IBrokersService } from "./IBrokersService";
import { IDatabaseTablesService } from "./IDatabaseTablesService";

export interface IDatabasesService {
  reloadConnectionsFromJson(): void;
  createConnection(params: any): number;
  testConnection(id: number): boolean;
  deleteConnection(id: number): boolean;
  updateConnection(id: number, params: any): boolean;
  getBrokersService(): IBrokersService;

  getDatabaseTablesService(id: number): IDatabaseTablesService | undefined;
  getDatabaseTablesServices(): IDatabaseTablesService[];
}
