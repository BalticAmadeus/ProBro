import { Constants } from '@src/common/Constants';
import { DatabaseProcessor } from '@src/db/DatabaseProcessor';
import { IProcessor } from '@src/db/IProcessor';
import { ProcessorType } from '@src/repo/processor/ProcessorType';
import { DbProcessor } from '@src/repo/processor/database/DbProcessor';
import { MockProcessor } from '@src/repo/processor/mock/MockProcessor';
import * as vscode from 'vscode';

export class ProcessorFactory {
    private static readonly processorType: ProcessorType =
        ProcessorType.Database;

    public static getProcessorInstance(): IProcessor {
        switch (ProcessorFactory.determineProcessorType()) {
            case ProcessorType.Database:
                return DbProcessor.getInstance();
            case ProcessorType.Mock:
                return MockProcessor.getInstance();
            case ProcessorType.Old:
                return DatabaseProcessor.getInstance();
            default:
                throw new Error('Invalid processor type');
        }
    }

    private static determineProcessorType(): ProcessorType {
        // TODO: delete after old processor is removed
        const configuration = vscode.workspace.getConfiguration(
            Constants.globalExtensionKey
        );
        const useNew: boolean =
            configuration.get('development.useNewDbClient') ?? false;

        console.log('useNew: ' + useNew);
        if (useNew === true) {
            return ProcessorType.Database;
        } else {
            return ProcessorType.Old;
        }
    }
}
