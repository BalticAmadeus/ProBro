import { IDatabasesService } from "./IDatabasesService";

export interface IBrokersService {
  createLocalBroker(brokerConfig: any): number;
  createRemoteBroker(brokerConfig: any): number;
  startLocalBroker(id: number): boolean;
  testConnection(id: number): boolean;
  stopLocalBroker(id: number): boolean;

  getDatabasesService(id: number): IDatabasesService | undefined;
  getDatabasesServices(): IDatabasesService[];
}
