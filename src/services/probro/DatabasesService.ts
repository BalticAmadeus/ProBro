import { IBrokersService } from "../interfaces/IBrokersService";
import { IDatabaseTablesService } from "../interfaces/IDatabaseTablesService";
import { IDatabasesService } from "../interfaces/IDatabasesService";

export class DatabasesService implements IDatabasesService {
  public constructor(broker: any) {}

  reloadConnectionsFromJson(): void {
    throw new Error("Method not implemented.");
  }
  createConnection(params: any): number {
    throw new Error("Method not implemented.");
  }
  testConnection(id: number): boolean {
    throw new Error("Method not implemented.");
  }
  deleteConnection(id: number): boolean {
    throw new Error("Method not implemented.");
  }
  updateConnection(id: number, params: any): boolean {
    throw new Error("Method not implemented.");
  }
  getBrokersService(): IBrokersService {
    throw new Error("Method not implemented.");
  }

  getDatabaseTablesServices(): IDatabaseTablesService[] {
    throw new Error("Method not implemented.");
  }

  getDatabaseTablesService(id: number): IDatabaseTablesService {
    throw new Error("Method not implemented.");
  }
}
