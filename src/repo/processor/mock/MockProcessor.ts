import { IProcessor } from '@src/db/IProcessor';

export class MockProcessor implements IProcessor {
    private static instance: MockProcessor | undefined = undefined; // singleton

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    public static getInstance(): MockProcessor {
        if (MockProcessor.instance === undefined) {
            MockProcessor.instance = new MockProcessor();
        }

        return MockProcessor.instance;
    }

    getDBVersion(): Promise<any> {
        return Promise.resolve('Mock DB Version');
    }

    getTablesList(): Promise<any> {
        return Promise.resolve('Mock Tables List');
    }

    getTableData(): Promise<any> {
        return Promise.resolve('Mock Table Data');
    }

    submitTableData(): Promise<any> {
        return Promise.resolve('Mock Submit Table Data');
    }

    getTableDetails(): Promise<any> {
        return Promise.resolve('Mock Table Details');
    }
}
