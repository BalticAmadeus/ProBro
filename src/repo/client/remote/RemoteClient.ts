import { ConnectionParams } from "../../ConnectionParams";
import { AClient } from "../AClient";
import { IClient } from "../IClient";

export class RemoteClient extends AClient implements IClient {
  public constructor(connectionParams: ConnectionParams) {
    super(connectionParams);

    this.listen(Promise.resolve());
  }
}
