import { IClient } from "../IClient";

export class RemoteClient implements IClient {
  private static remoteClient: RemoteClient | undefined;

  private constructor() {
    console.log("RemoteClient constructor");
  }

  // singleton
  public static getInstance(): IClient {
    if (RemoteClient.remoteClient === undefined) {
      RemoteClient.remoteClient = new RemoteClient();
    }
    return RemoteClient.remoteClient;
  }
  sendRequest(cmd: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
