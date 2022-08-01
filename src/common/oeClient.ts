import * as Net from "net"
import * as cp from "child_process";
import * as vscode from "vscode";
import { Constants } from "./constants";

class OEClient {
    private port: number = 23456;
    private host: string = 'localhost';
    private client!: Net.Socket;
    private data!: string;
    private dataFinish!: any;
    private procFinish!: any;
    private pclientFinish!: any;
    private proc!: cp.ChildProcessWithoutNullStreams;
    private enc = new TextDecoder("utf-8");

    constructor() {
    }

    public init(): Promise<any> {
        return this.runProc().then((resolve) => {

            this.client = new Net.Socket();
            this.client.connect(this.port, this.host, () => {
                console.log('TCP connection established with the server.');
            });
            // The client can also receive data from the server by reading from its socket.
            this.client.on('data', (chunk) => {
                console.log(`Data received from the server`);
                this.data += chunk.toString();
                if (this.data.endsWith(`\n`)) {
                    this.dataFinish(this.data);
                }
            });

            this.client.on('end', () => {
                console.log('Requested an end to the TCP connection');
            });
            return this;
        });
    }

    private runProc(): Promise<any> {
        return new Promise((resolve) => {

            const cmd = `${Constants.context.extensionPath}\\resources\\oe\\oe.bat -b -p "${Constants.context.extensionPath}\\resources\\oe\\oeSocket.p" -param "${Buffer.from('PARAM').toString('base64')}"`;

            this.proc = cp.spawn('cmd.exe', ['/c',
                `${Constants.context.extensionPath}\\resources\\oe\\oe.bat`,
                '-b',
                '-p',
                `${Constants.context.extensionPath}\\resources\\oe\\oeSocket.p`,
                '-debugalert',
                '-clientlog',
                `${Constants.context.extensionPath}\\resources\\oe\\oeSocket.pro`
            ]);

            this.proc.on('exit', (code, signal) => {
                console.log('child process exited with ' +
                    `code ${code} and signal ${signal}`);
            });

            this.proc.on('error', (error) =>
                console.log('child process error: \n', error)
            );

            this.proc.stdout.on('data', (data) => {
                console.log(`child stdout:\n${data}`);
                const dataString = this.enc.decode(data);
                if (dataString.startsWith('SERVER STARTED')) {
                    this.procFinish(dataString);
                }
            });

            this.proc.stderr.on('data', (data) => {
                console.error(`child stderr:\n${data}`);
            });

            this.procFinish = resolve;
        })
    }

    public sendCommand(cmd: string): Promise<string> {
        this.data = "";
        return new Promise((resolve) => {
            this.client.write(`${cmd}\n`);
            this.dataFinish = resolve
        })
    }
}

var client: OEClient;

function getOEClient(): Promise<any> {
    if (!client) {
        client = new OEClient();
        return client.init();
    }
    return new Promise((resolve) => {
        resolve(client);
    });
}

export default getOEClient;
