import * as Net from "net";

import { ConnectionParams } from "../ConnectionParams";

export class AClient {
  protected connectionParams: ConnectionParams;
  protected data!: string;
  protected client!: Net.Socket;

  protected dataFinish!: any;
  protected procFinish!: any;
  protected enc = new TextDecoder("utf-8");

  protected constructor(connectionParams: ConnectionParams) {
    this.connectionParams = connectionParams;
  }

  protected async listen(start: Promise<any>): Promise<any> {
    return start.then(() => {
      this.client = new Net.Socket();
      this.client.connect(
        this.connectionParams.port,
        this.connectionParams.host,
        () => {
          console.log(
            "TCP connection established with the server at " +
              this.connectionParams.port.toString() +
              "."
          );
        }
      );

      this.client.on("data", (chunk) => {
        console.log(`Data received from the server`);
        this.data += chunk.toString();
        if (this.data.endsWith(`\n`)) {
          this.dataFinish(this.data);
        }
      });

      this.client.on("end", () => {
        console.log("Requested an end to the TCP connection");
      });

      return this;
    });
  }

  public sendRequest(cmd: string): Promise<string> {
    this.data = "";

    return new Promise((resolve, reject) => {
      this.client.write(`${cmd}\n`);
      this.dataFinish = resolve;
    });
  }
}
