import { ConnectionParams } from '@app/model';
import * as Net from 'net';

export class AClient {
    protected connectionParams: ConnectionParams;
    protected data!: string;
    protected client!: Net.Socket;

    protected dataFinish!: any;
    protected procFinish!: any;
    protected enc = new TextDecoder('utf-8');

    protected constructor(connectionParams: ConnectionParams) {
        this.connectionParams = connectionParams;
    }

    protected listen(): Promise<any> {
        return new Promise((resolve) => {
            console.log('V2: Starting TCP listener');
            this.client = new Net.Socket();
            this.client.connect(
                this.connectionParams.port,
                this.connectionParams.host,
                () => {
                    console.log(
                        'V2: TCP connection established with the server at ' +
                            this.connectionParams.port.toString() +
                            '.'
                    );
                }
            );

            this.client.on('data', (chunk) => {
                console.log('V2: Data received from the server');
                this.data += chunk.toString();
                if (this.data.endsWith('\n')) {
                    this.dataFinish(this.data);
                    console.log('V2: Data finish');
                }
            });

            this.client.on('end', () => {
                console.log('V2: Requested an end to the TCP connection');
            });

            return this;
        });
    }

    public sendRequest(cmd: string): Promise<string> {
        this.data = '';

        try {
            return new Promise((resolve) => {
                console.log('V2: Sending request to server');
                this.client.write(`${cmd}\n`);
                this.dataFinish = resolve;
            });
        } finally {
            console.log('V2: Request sent');
        }
    }
}
