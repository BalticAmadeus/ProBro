import { IConnectionConfig } from '@app/model';

export interface IClientHelper {
    formConnectionString(config: IConnectionConfig): string;
}
