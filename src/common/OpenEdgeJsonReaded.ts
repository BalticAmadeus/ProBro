import { PfParser } from '../view/app/utils/PfParser';
import { IConfig } from '../view/app/model';
import * as path from 'path';
import * as fs from 'fs';
import stripjsoncomments from 'strip-json-comments';
import {
    createImportedConnectionId,
    getImportedConnectionIdentityKey,
    importedConnectionDescription,
} from './ImportedProjectConnections';

export interface ParseOEFileOptions {
    groupName?: string;
    idPrefix?: string;
}

export function readFile(fileName: string): string {
    return fs.readFileSync(fileName, 'utf-8');
}

export function getOEVersion(fileContent: string) {
    return JSON.parse(stripjsoncomments(fileContent)).oeversion;
}

export function parseOEFile(
    fileContent: string,
    filePath: string,
    options: ParseOEFileOptions = {},
) {
    const data = JSON.parse(stripjsoncomments(fileContent));
    const { name, dbConnections = [] } = data;
    if (!Array.isArray(dbConnections)) {
        throw new Error('The dbConnections property must be an array.');
    }
    const configList: IConfig[] = [];

    const groupName = options.groupName ?? name;
    const idPrefix = options.idPrefix ?? 'local';
    const connectionIdentityCounts = new Map<string, number>();

    const directoryPath = path.dirname(filePath);

    dbConnections.forEach((connection: { name: string; connect: string }) => {
        const { name, connect } = connection;

        const pfParser = new PfParser();
        const pfConfig = pfParser.parse(connect);

        if (pfConfig.isReadOnly && !path.isAbsolute(pfConfig.name)) {
            pfConfig.name = path.join(directoryPath, pfConfig.name);
            if (pfConfig.name.startsWith('\\')) {
                pfConfig.name = pfConfig.name.slice(1);
            }
        }

        const config: IConfig = {
            id: '',
            label: name,
            name: pfConfig.name,
            description: importedConnectionDescription,
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

        const identityKey = getImportedConnectionIdentityKey(config);
        const occurrence = (connectionIdentityCounts.get(identityKey) ?? 0) + 1;
        connectionIdentityCounts.set(identityKey, occurrence);
        config.id = createImportedConnectionId(idPrefix, config, occurrence);

        configList.push(config);
    });

    return configList;
}
