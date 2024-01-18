import {
    IRemoteConnectionConfig
} from '../../../view/app/model';
import { IClient } from '../IClient';
import { RemoteClient } from './RemoteClient';

export class RemoteClientStorage {
    private static remoteClientMap: Map<string, IClient> = new Map<
    string,
    RemoteClient
  >();

    public static async getInstance(
        connectionConfig: IRemoteConnectionConfig
    ): Promise<IClient> {
        if (
            !RemoteClientStorage.remoteClientMap.has(connectionConfig.connectionId)
        ) {
            RemoteClientStorage.remoteClientMap.set(
                connectionConfig.connectionId,
                new RemoteClient(connectionConfig.agentConParams)
            );
        }

        let remoteClient = RemoteClientStorage.remoteClientMap.get(
            connectionConfig.connectionId
        );

        if (remoteClient === undefined) {
            return new Promise(() => {
                throw new Error(
                    `No remote client found for connectionId: ${connectionConfig.connectionId}`
                );
            });
        }

        return remoteClient;
    }
}
