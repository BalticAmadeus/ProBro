import * as Net from 'net';
import * as cp from 'child_process';
import { Constants } from '../common/Constants';
import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require('path');

class OEClient {
    private port: number;
    private host: string;
    private client!: Net.Socket;
    private data!: string;
    private dataFinish!: any;
    private procFinish!: any;
    private proc!: cp.ChildProcessWithoutNullStreams;
    private enc = new TextDecoder('utf-8');
    private readonly configuration = vscode.workspace.getConfiguration(
        Constants.globalExtensionKey
    );
    private logentrytypes: string =
        this.configuration.get('logging.openEdge') ?? 'not found';
    private tempFilesPath: string =
        this.configuration.get('tempfiles') ?? 'not found';
    private pfFilePath: string = path.join(
        Constants.context.extensionPath,
        'resources',
        'oe',
        'connectionPf.pf'
    );

    constructor(port: number, host: string) {
        this.port = port;
        this.host = host;
    }

    public init(): Promise<any> {
        return this.runProc().then((resolve) => {
            this.client = new Net.Socket();
            this.client.connect(this.port, this.host, () => {
                console.log(
                    'TCP connection established with the server at ' +
                        this.port.toString() +
                        '.'
                );
            });
            // The client can also receive data from the server by reading from its socket.
            this.client.on('data', (chunk) => {
                console.log('Data received from the server');
                this.data += chunk.toString();
                if (this.data.endsWith('\n')) {
                    this.dataFinish(this.data);
                }
            });

            this.client.on('end', () => {
                console.log('Requested an end to the TCP connection');
            });

            console.log('V1: OE Client initialized');
            return this;
        });
    }

    private runProc(): Promise<any> {
        return new Promise((resolve) => {
            if (process.platform === 'linux') {
                const accessScript = `chmod +x ${path.join(
                    Constants.context.extensionPath,
                    'resources',
                    'oe',
                    'scripts',
                    'oe.sh'
                )}`;
                console.log(accessScript);
                cp.execSync(accessScript);

                this.createPfFile();
                this.proc = cp.spawn('bash', [
                    '-c',
                    [
                        `"${path.join(
                            Constants.context.extensionPath,
                            'resources',
                            'oe',
                            'scripts',
                            'oe.sh'
                        )}"`,
                        '-p',
                        `"${path.join(
                            Constants.context.extensionPath,
                            'resources',
                            'oe',
                            'src',
                            'oeSocket.p'
                        )}"`,
                        '-clientlog',
                        `"${path.join(
                            Constants.context.extensionPath,
                            'resources',
                            'oe',
                            'oeSocket.pro'
                        )}"`,
                        '-pf',
                        `"${this.pfFilePath}"`,
                        `"${Constants.dlc}"`,
                    ].join(' '),
                ]);
            } else if (process.platform === 'win32') {
                this.createPfFile();
                this.proc = cp.spawn('cmd.exe', [
                    '/c',
                    [
                        path.join(
                            Constants.context.extensionPath,
                            'resources',
                            'oe',
                            'scripts',
                            'oe.bat'
                        ),
                        '-p',
                        path.join(
                            Constants.context.extensionPath,
                            'resources',
                            'oe',
                            'src',
                            'oeSocket.p'
                        ),
                        '-clientlog',
                        path.join(
                            Constants.context.extensionPath,
                            'resources',
                            'oe',
                            'oeSocket.pro'
                        ),
                        '-pf',
                        this.pfFilePath,
                        Constants.dlc,
                    ].join(' '),
                ]);
            } else {
                // should be error here
            }

            this.proc.on('exit', (code, signal) => {
                console.log(
                    'child process exited with ' +
                        `code ${code} and signal ${signal}`
                );
            });

            this.proc.on('error', (error) =>
                console.log('child process error: \n', error)
            );

            this.proc.stdout.on('data', (data) => {
                console.log(`child stdout:\n${data}`);
                const dataString = this.enc.decode(data);
                if (
                    dataString.startsWith(
                        'SERVER STARTED AT ' + this.port.toString()
                    )
                ) {
                    this.procFinish(dataString);
                }
                else if (dataString.startsWith( 'DLC environment variable not set correctly ')){
                    vscode.window.showErrorMessage(dataString);
                }
            });

            this.proc.stderr.on('data', (data) => {
                console.error(`child stderr:\n${data}`);
            });

            this.procFinish = resolve;
        });
    }

    public sendCommand(cmd: string): Promise<string> {
        this.data = '';
        return new Promise((resolve) => {
            this.client.write(`${cmd}\n`);
            this.dataFinish = resolve;
        });
    }

    public createPfFile(): void {
        const pfContent = [
            this.tempFilesPath.length !== 0 ? `-T ${this.tempFilesPath}` : null,
            '-b',
            '-param',
            this.port.toString(),
            '-debugalert',
            this.logentrytypes.length !== 0
                ? `-logentrytypes ${this.logentrytypes}`
                : null,
        ].join(' ');

        fs.writeFile(this.pfFilePath, pfContent, () => {
            console.log('pf file created');
        });
    }
}

let client: OEClient;

async function getOEClient(): Promise<any> {
    let port: number | undefined;
    const host = 'localhost';
    if (!client) {
        await vscode.commands.executeCommand(
            `${Constants.globalExtensionKey}.releasePort`
        );
        await vscode.commands
            .executeCommand(`${Constants.globalExtensionKey}.getPort`)
            .then((portVal: any) => {
                port = portVal;
            });

        if (!port) {
            return new Promise(() => {
                throw new Error('No port provided. Unable to start connection');
            });
        }
        client = new OEClient(port, host);
        return client.init();
    }
    return Promise.resolve(client);
}

export default getOEClient;
