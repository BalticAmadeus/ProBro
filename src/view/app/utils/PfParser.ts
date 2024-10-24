import { IConfig } from '../model';

export class PfParser {
    public parse(pfFile: string): IConfig {
        const config: IConfig = {
            id: 'connection',
            label: '',
            name: '',
            description: '',
            host: '',
            port: '',
            user: '',
            password: '',
            group: '',
            params: '',
            connectionId: 'LOCAL',
            type: 0,
            isReadOnly: false,
        };

        pfFile
            .split('\n')
            .filter((params) => {
                return (
                    params && params.trim() !== '' && !params.startsWith('#')
                );
            })
            .forEach((param) => {
                param.match(/(-[A-Za-z0-9]+)/g)?.forEach((key) => {
                    let regexStr;
                    if (new RegExp(`(${key}\\s)('|")`).test(param)) {
                        regexStr = `(${key}\\s)('|")([^'^"]*)('|")`;
                    } else {
                        regexStr = `(${key}\\s*)([\\S]+)*`;
                    }
                    const keyVal = param.match(new RegExp(regexStr));
                    if (!keyVal) {
                        return;
                    }
                    switch (key) {
                        case '-db':
                            config.name = keyVal[0].substring(key.length + 1);
                            break;
                        case '-U':
                            config.user = keyVal[0].substring(key.length + 1);
                            break;
                        case '-P':
                            config.password = keyVal[0].substring(
                                key.length + 1
                            );
                            break;
                        case '-H':
                            config.host = keyVal[0].substring(key.length + 1);
                            break;
                        case '-S':
                            config.port = keyVal[0].substring(key.length + 1);
                            break;
                        case '-RO':
                            config.isReadOnly = true;
                            if (config.params) {
                                config.params += ' ';
                            }
                            config.params += keyVal[0];
                            break;
                        default:
                            if (config.params) {
                                config.params += ' ';
                            }
                            config.params += keyVal[0];
                            break;
                    }
                });
            });
        return config;
    }
}
