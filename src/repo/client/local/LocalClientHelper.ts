import { IConfig } from '../../../view/app/model';
import { IClientHelper } from '../IClientHelper';

export class LocalClientHelper implements IClientHelper {
    // singleton
    private static instance: LocalClientHelper | undefined;

    public static getInstance(): LocalClientHelper {
        if (LocalClientHelper.instance === undefined) {
            LocalClientHelper.instance = new LocalClientHelper();
        }

        return LocalClientHelper.instance;
    }

    public formConnectionString(config: IConfig): string {
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
