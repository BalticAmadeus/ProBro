import { ClientType } from "./ClientType";
import { LocalClient } from "./local/LocalClient";
import { RemoteClient } from "./remote/RemoteClient";

export class ClientFactory {
  static getInstance(clientType: ClientType) {
    switch (clientType) {
      case ClientType.local:
        return LocalClient.getInstance();
      case ClientType.remote:
        return RemoteClient.getInstance();
      default:
        throw new Error("Invalid client type");
    }
  }
}
