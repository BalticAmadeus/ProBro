import { PfParser } from '../view/app/utils/PfParser';
import { IConfig } from '../view/app/model';
import * as jsonminify from 'jsonminify';
import * as path from 'path';
import * as fs from 'fs';

export function readFile(fileName: string): string {
    const allFileContents = fs.readFileSync(fileName, 'utf-8');
    return allFileContents;
}

export function getOEVersion(fileContent: string) {
    const data = JSON.parse(jsonminify(fileContent));
    const { oeversion } = data;

    return oeversion;
}

export function parseOEFile(fileContent: string, filePath: string) {
    const data = JSON.parse(jsonminify(fileContent));
    const { name, dbConnections } = data;
    const configList: IConfig[] = [];

    const groupName = name;
    let num = 0;

    const directoryPath = path.dirname(filePath);

    dbConnections.forEach((connection: { name: string; connect: string }) => {
        const { name, connect } = connection;

        const pfParser = new PfParser();
        const pfConfig = pfParser.parse(connect);

        num++;

        if (pfConfig.isReadOnly && !path.isAbsolute(pfConfig.name)) {
            pfConfig.name = path.join(directoryPath, pfConfig.name);
            if (pfConfig.name.startsWith('\\')) {
                pfConfig.name = pfConfig.name.slice(1);
            }
        }

        const config: IConfig = {
            id: 'local' + num,
            label: name,
            name: pfConfig.name,
            description: 'from openedge-project.json',
            host: pfConfig.host,
            port: pfConfig.port,
            user: pfConfig.user,
            password: pfConfig.password,
            group: groupName,
            params: pfConfig.params,
            connectionId: 'LOCAL',
            type: 0,
            isReadOnly: pfConfig.isReadOnly,
        };

        configList.push(config);
    });

    return configList;
}
