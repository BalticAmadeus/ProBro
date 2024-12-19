import { IRemoteConnectionConfig } from '@app/model';
import { IClientHelper } from '@src/repo/client/IClientHelper';

export class RemoteClientHelper implements IClientHelper {
    // singleton
    private static instance: RemoteClientHelper | undefined;

    public static getInstance(): RemoteClientHelper {
        if (RemoteClientHelper.instance === undefined) {
            RemoteClientHelper.instance = new RemoteClientHelper();
        }

        return RemoteClientHelper.instance;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public formConnectionString(_config: IRemoteConnectionConfig): string {
        throw new Error('Method not yet implemented.');
    }
}
