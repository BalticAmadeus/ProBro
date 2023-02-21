export interface ISettings{
    batchSize: number;
    batchMaxTimeout: number;
    initialBatchSizeLoad: number;
    logging: ILogging
}

export interface ILogging {
    react: boolean,
    node: boolean,
    openEdge: string}