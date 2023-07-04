import { IConnectionConfig } from "../../view/app/model";

export interface IClient {
  sendRequest(cmd: string): Promise<string>;
}
