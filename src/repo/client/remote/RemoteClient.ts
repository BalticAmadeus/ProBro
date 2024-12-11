import { ConnectionParams } from '@app/model';
import { AClient } from '@src/repo/client/AClient';
import { IClient } from '@src/repo/client/IClient';

export class RemoteClient extends AClient implements IClient {
    public constructor(connectionParams: ConnectionParams) {
        super(connectionParams);
    }
}
