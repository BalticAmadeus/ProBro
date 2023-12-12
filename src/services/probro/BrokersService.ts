import { IBrokersService } from "../interfaces/IBrokersService";
import { IDatabasesService } from "../interfaces/IDatabasesService";

export class BrokersService implements IBrokersService {
  private brokers: any[] = [];

  public constructor() {}

  createLocalBroker(brokerConfig: any): number {
    throw new Error("Method not implemented.");
  }
  createRemoteBroker(brokerConfig: any): number {
    throw new Error("Method not implemented.");
  }
  startLocalBroker(id: number): boolean {
    throw new Error("Method not implemented.");
  }
  testConnection(id: number): boolean {
    throw new Error("Method not implemented.");
  }
  stopLocalBroker(id: number): boolean {
    throw new Error("Method not implemented.");
  }

  getDatabasesServices(): IDatabasesService[] {
    throw new Error("Method not implemented.");
  }

  getDatabasesService(id: number): IDatabasesService {
    throw new Error("Method not implemented.");
  }
}
