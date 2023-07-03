import { IClient } from "./IClient";
import { LocalClient } from "./local/LocalClient";
import { RemoteClientStorage } from "./remote/RemoteClientStorage";

export class ClientFactory {
  public static async getInstance(connectionId: number): Promise<IClient> {
    switch (connectionId) {
      case 0:
        return LocalClient.getInstance();
      default:
        return RemoteClientStorage.getInstance(connectionId);
    }
  }
}
