import { ConnectionParams } from '@app/model';
import { Constants } from '@src/common/Constants';
import { AClient } from '@src/repo/client/AClient';
import { IClient } from '@src/repo/client/IClient';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as vscode from 'vscode';
import path = require('path');

export class LocalClient extends AClient implements IClient {
    private static localClient: LocalClient | undefined = undefined;

    private static readonly host = 'localhost';
    private readonly configuration = vscode.workspace.getConfiguration(
        Constants.globalExtensionKey
    );
    private logentrytypes: string =
        this.configuration.get('logging.openEdge') ?? 'not found';
    private tempFilesPath: string =
        this.configuration.get('tempfiles') ?? 'not found';
    protected proc!: cp.ChildProcessWithoutNullStreams;

    private constructor(connectionParams: ConnectionParams) {
        super(connectionParams);
    }

    // singleton
    public static async getInstance(): Promise<IClient> {
        if (LocalClient.localClient === undefined) {
            LocalClient.localClient = new LocalClient(
                new ConnectionParams(this.host, await this.getPort())
            );

            await LocalClient.localClient.init();
        }

        console.log('V2: Returning local client');
        return LocalClient.localClient;
    }

    private async init(): Promise<any> {
        return this.startAndListen().finally(() => {
            console.log('V2: started and listened');
        });
    }

    private static async getPort(): Promise<number> {
        let port: number | undefined;

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
        return port;
    }

    protected pfFilePath: string = path.join(
        Constants.context.extensionPath,
        'resources',
        'oe',
        'connectionPf.pf'
    );

    private readonly linuxProPath = `"${path.join(
        Constants.dlc,
        'bin',
        '_progres'
    )}"`;

    protected readonly linuxConnectionString = [
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
    ];

    private readonly windowsProPath = path.join(
        Constants.dlc,
        'bin',
        '_progres'
    );

    protected readonly windowsConnectionString = [
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
    ];

    protected readonly windowsOptions = {
        cwd: path.join(Constants.context.extensionPath, 'resources', 'oe'),
    };

    protected async startAndListen(): Promise<any> {
        return this.start()
            .then(() => {
                this.listen();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    protected async start(): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log('V2: Starting OE client');
            this.createPfFile();

            switch (process.platform) {
                case 'linux':
                    this.proc = cp.spawn(
                        this.linuxProPath,
                        this.linuxConnectionString
                    );
                    break;
                case 'win32':
                    this.proc = cp.spawn(
                        this.windowsProPath,
                        this.windowsConnectionString,
                        this.windowsOptions
                    );
                    break;
                default:
                    reject('Unsupported platform');
            }

            this.proc.stdout.on('data', (data) => {
                console.log(`child stdout: ${data}`);

                const dataString = this.enc.decode(data);
                if (
                    dataString.startsWith(
                        'SERVER STARTED AT ' +
                            this.connectionParams.port.toString()
                    )
                ) {
                    this.procFinish(dataString);
                    console.log('V2: Server started');
                }
            });

            this.proc.stderr.on('data', (data) => {
                console.log(`stderr: ${data}`);
            });

            this.proc.on('exit', (code) => {
                console.log(`child process exited with code ${code}`);
            });

            this.proc.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
            });

            this.proc.on('error', (err) => {
                console.log(`child process error ${err}`);
            });

            this.procFinish = resolve;
        });
    }
    private createPfFile(): void {
        const pfContent = [
            this.tempFilesPath.length !== 0 ? `-T ${this.tempFilesPath}` : null,
            '-b',
            '-param',
            this.connectionParams.port.toString(),
            '-debugalert',
            this.logentrytypes.length !== 0
                ? `-logentrytypes ${this.logentrytypes}`
                : null,
        ].join(' ');

        try {
            fs.writeFileSync(this.pfFilePath, pfContent);
            console.log('pf file created');
        } catch (error) {
            console.log('error while creating pf file', error);
        }
    }
}
