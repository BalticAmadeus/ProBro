import { ConnectionParams } from "../../ConnectionParams";
import { IClient } from "../IClient";
import { RemoteClient } from "./RemoteClient";

export class RemoteClientStorage {
  private static remoteClientMap: Map<number, IClient> = new Map<
    number,
    RemoteClient
  >();

  public static async getInstance(connectionId: number): Promise<IClient> {
    if (!RemoteClientStorage.remoteClientMap.has(connectionId)) {
      RemoteClientStorage.remoteClientMap.set(
        connectionId,
        new RemoteClient(RemoteClientStorage.getConnectionParams(connectionId))
      );
    }

    var remoteClient = RemoteClientStorage.remoteClientMap.get(connectionId);

    if (remoteClient === undefined) {
      return new Promise(() => {
        throw new Error(
          `No remote client found for connectionId: ${connectionId}`
        );
      });
    }

    return remoteClient;
  }

  private static getConnectionParams(connectionId: number): ConnectionParams {
    //TODO: get connection params for connectionId
    return new ConnectionParams("localhost", 0);
  }
}
