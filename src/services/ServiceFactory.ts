import { BrokersService } from "./probro/BrokersService";
import { IBrokersService } from "./interfaces/IBrokersService";
import { IDatabaseTablesService } from "./interfaces/IDatabaseTablesService";
import { IDatabasesService } from "./interfaces/IDatabasesService";
import { ITableQueriesService } from "./interfaces/ITableQueriesService";
import { IUserStorageService } from "./interfaces/IUserStorageService";
import { UserStorageProxy } from "./vscode/UserStorageProxy";
import { ExtensionContext } from "vscode";
import { IPortsService } from "./interfaces/IPortsService";
import { PortsService } from "./probro/PortsService";

export class ServiceFactory {
  private static self: ServiceFactory | undefined = undefined;
  private static brokersService: IBrokersService | undefined = undefined;
  private static userStorageService: IUserStorageService | undefined =
    undefined;
  private static portsService: IPortsService | undefined = undefined;

  private static context: ExtensionContext;

  public static init(context: ExtensionContext) {
    ServiceFactory.context = context;
  }

  //FOR FUTURE
  public static setMode(mode: string): void {
    return;
  }

  public static getBrokersService(): IBrokersService {
    if (ServiceFactory.brokersService === undefined) {
      ServiceFactory.brokersService = new BrokersService();
    }

    return ServiceFactory.brokersService;
  }

  public static getDatabasesService(
    brokerService: IBrokersService
  ): IDatabasesService {
    throw Error("Not implemented!");
  }

  public static getDatabaseTablesService(
    databasesService: IDatabasesService
  ): IDatabaseTablesService {
    throw Error("Not implemented!");
  }

  public static getTableQueryService(
    databaseTablesService: IDatabaseTablesService
  ): ITableQueriesService {
    throw Error("Not implemented!");
  }

  public static getPortsService(): IPortsService {
    if (ServiceFactory.portsService === undefined) {
      ServiceFactory.portsService = new PortsService();
    }

    return ServiceFactory.portsService;
  }

  public static getUserStorageService(): IUserStorageService {
    if (ServiceFactory.userStorageService === undefined) {
      ServiceFactory.userStorageService = new UserStorageProxy(
        ServiceFactory.context.workspaceState,
        ServiceFactory.context.globalState
      );
    }

    return ServiceFactory.userStorageService;
  }
}
