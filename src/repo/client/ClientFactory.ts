import { IClient } from '@src/repo/client/IClient';
import { IClientHelper } from '@src/repo/client/IClientHelper';
import { LocalClient } from '@src/repo/client/local/LocalClient';
import { LocalClientHelper } from '@src/repo/client/local/LocalClientHelper';
import { RemoteClientHelper } from '@src/repo/client/remote/RemoteClientHelper';
import { RemoteClientStorage } from '@src/repo/client/remote/RemoteClientStorage';
import { ConnectionType, IConnectionConfig } from '../../view/app/model';

export class ClientFactory {
    public static async getInstance(
        connectionConfig: IConnectionConfig
    ): Promise<IClient> {
        switch (connectionConfig.type) {
            case ConnectionType.Local:
                return LocalClient.getInstance();
            case ConnectionType.Remote:
                return RemoteClientStorage.getInstance(connectionConfig);
            default:
                return LocalClient.getInstance(); //TODO
        }
    }

    public static async getClientHelperInstance(
        connectionConfig: IConnectionConfig
    ): Promise<IClientHelper> {
        switch (connectionConfig.connectionId) {
            case 'LOCAL':
                return LocalClientHelper.getInstance();
            case 'TEST':
                return RemoteClientHelper.getInstance();
            default:
                return LocalClientHelper.getInstance(); //TODO
        }
    }
}
