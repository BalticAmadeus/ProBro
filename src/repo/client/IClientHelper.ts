import { IConnectionConfig } from "../../view/app/model";

export interface IClientHelper {
  formConnectionString(config: IConnectionConfig): string;
}
