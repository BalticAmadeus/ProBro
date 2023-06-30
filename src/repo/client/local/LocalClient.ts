import { IClient } from "../IClient";

export class LocalClient implements IClient {
  private static localClient: LocalClient | undefined;

  private constructor() {
    console.log("LocalClient constructor");
  }

  // singleton
  public static getInstance(): IClient {
    if (LocalClient.localClient === undefined) {
      LocalClient.localClient = new LocalClient();
    }
    return LocalClient.localClient;
  }
  sendRequest(cmd: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
