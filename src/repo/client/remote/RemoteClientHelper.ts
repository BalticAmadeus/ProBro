import { IRemoteConnectionConfig } from '../../../view/app/model';
import { IClientHelper } from '../IClientHelper';

export class RemoteClientHelper implements IClientHelper {
    // singleton
    private static instance: RemoteClientHelper | undefined;

    public static getInstance(): RemoteClientHelper {
        if (RemoteClientHelper.instance === undefined) {
            RemoteClientHelper.instance = new RemoteClientHelper();
        }

        return RemoteClientHelper.instance;
    }

    public formConnectionString(config: IRemoteConnectionConfig): string {
        return 'Hellp from RemoteClientHelper';
    }
}
