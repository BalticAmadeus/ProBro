import * as vscode from 'vscode';
import { IConfig, ITableData, TableDetails } from '../view/app/model';
import { IProcessor } from './IProcessor';
import { IOEParams } from './Oe';
import getOEClient from './OeClient';
import { Logger } from '../common/Logger';
import { Constants } from '../common/Constants';

export class DatabaseProcessor implements IProcessor {
    private static instance: DatabaseProcessor; // singleton
    private static processStartTime: number | undefined = undefined; // undefined means process is not running
    private static processTimeout = 5000; // 5 seconds
    private static errObj = { errMessage: '', isError: false };

    private readonly configuration = vscode.workspace.getConfiguration(
        Constants.globalExtensionKey
    );
    private logger = new Logger(
        this.configuration.get('logging.node') ?? false
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    public static getInstance(): DatabaseProcessor {
        if (!DatabaseProcessor.instance) {
            DatabaseProcessor.instance = new DatabaseProcessor();
        }

        return DatabaseProcessor.instance;
    }

    public getDBVersion(config: IConfig): Promise<any> {
        const params: IOEParams = {
            connectionString: this.getConnectionString(config),
            command: 'get_version',
        };
        return this.execShell(params);
    }

    public getTablesList(config: IConfig): Promise<any> {
        const params: IOEParams = {
            connectionString: this.getConnectionString(config),
            command: 'get_tables',
        };
        return this.execShell(params);
    }

    public getTableData(
        config: IConfig,
        tableName: string | undefined,
        inputParams: ITableData | undefined
    ) {
        if (config && tableName && inputParams) {
            const params: IOEParams = {
                connectionString: this.getConnectionString(config),
                command: 'get_table_data',
                params: { tableName: tableName, ...inputParams },
            };
            return this.execShell(params);
        } else {
            return Promise.resolve({ columns: [], data: [] });
        }
    }

    public submitTableData(
        config: IConfig,
        tableName: string | undefined,
        inputParams: ITableData | undefined
    ) {
        if (config && tableName && inputParams) {
            const params: IOEParams = {
                connectionString: this.getConnectionString(config),
                command: 'submit_table_data',
                params: { tableName: tableName, ...inputParams },
            };
            return this.execShell(params);
        } else {
            return Promise.resolve({ columns: [], data: [] });
        }
    }

    public async getTableDetails(
        config: IConfig | undefined,
        tableName: string | undefined
    ): Promise<TableDetails> {
        if (config && tableName) {
            const params: IOEParams = {
                connectionString: this.getConnectionString(config),
                command: 'get_table_details',
                params: tableName,
            };
            return {
                ...(await this.execShell(params)),
                tableName: tableName ?? '',
            };
        } else {
            return Promise.resolve({
                fields: [],
                indexes: [],
                tableName: tableName ?? '',
            });
        }
    }

    private execShell(params: IOEParams): Promise<any> {
        const cmd = `${Buffer.from(JSON.stringify(params)).toString('base64')}`;
        if (
            // if process is running and not timed out
            DatabaseProcessor.processStartTime !== undefined &&
            DatabaseProcessor.processStartTime +
                DatabaseProcessor.processTimeout >
                Date.now()
        ) {
            // then return error
            vscode.window.showInformationMessage('Processor is busy');
            return Promise.resolve(new Error('Processor is busy'));
        }

        if (DatabaseProcessor.errObj.isError) {
            //
            vscode.window.showErrorMessage(DatabaseProcessor.errObj.errMessage);
            return Promise.resolve(
                new Error(DatabaseProcessor.errObj.errMessage)
            );
        }

        DatabaseProcessor.processStartTime = Date.now();
        this.logger.log('execShell params', params);
        const timeInMs = Date.now();

        return getOEClient()
            .then((client) => {
                console.log(cmd);
                return client.sendCommand(cmd);
            })
            .then((data) => {
                const json = JSON.parse(data);
                console.log(
                    `Process time: ${Date.now() - timeInMs}, OE time: ${
                        json.debug.time
                    }, Connect time: ${json.debug.timeConnect}`
                );
                console.log(json.debug);
                this.logger.log('getOEClient returns', json);
                DatabaseProcessor.processStartTime = undefined;
                return json;
            })
            .catch((err) => {
                this.logger.log('getOeClient error', err.message);
                vscode.window.showWarningMessage(err.message);
                DatabaseProcessor.errObj.isError = true;
                DatabaseProcessor.errObj.errMessage = err.message;
                DatabaseProcessor.processStartTime = undefined;
                return Promise.resolve(new Error(err.message));
            });
    }

    private getConnectionString(config: IConfig) {
        if (!config.params.includes('-ct')) {
            if (config.params === '') {
                config.params += '-ct 1';
            } else {
                config.params += ' -ct 1';
            }
        }

        const connectionString = `-db ${config.name} ${
            config.user ? '-U ' + config.user : ''
        } ${config.password ? '-P ' + config.password : ''} ${
            config.host ? '-H ' + config.host : ''
        } ${config.port ? '-S ' + config.port : ''} ${config.params}`;
        return connectionString;
    }
}
