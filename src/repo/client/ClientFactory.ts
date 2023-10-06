import { ConnectionType, IConnectionConfig } from "../../view/app/model";
import { IClient } from "./IClient";
import { IClientHelper } from "./IClientHelper";
import { LocalClient } from "./local/LocalClient";
import { LocalClientHelper } from "./local/LocalClientHelper";
import { RemoteClientHelper } from "./remote/RemoteClientHelper";
import { RemoteClientStorage } from "./remote/RemoteClientStorage";

export class ClientFactory {
  public static async getInstance(
    connectionConfig: IConnectionConfig
  ): Promise<IClient> {
    switch (connectionConfig.type) {
      case ConnectionType.Local:
        return LocalClient.getInstance();
      case ConnectionType.Remote:
        return RemoteClientStorage.getInstance(connectionConfig);
      default:
        return LocalClient.getInstance(); //TODO
    }
  }

  public static async getClientHelperInstance(
    connectionConfig: IConnectionConfig
  ): Promise<IClientHelper> {
    switch (connectionConfig.connectionId) {
      case "LOCAL":
        return LocalClientHelper.getInstance();
      case "TEST":
        return RemoteClientHelper.getInstance();
      default:
        return LocalClientHelper.getInstance(); //TODO
    }
  }
}
