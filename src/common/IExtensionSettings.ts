export interface ISettings {
    batchSize: number;
    batchMaxTimeout: number;
    batchMinTimeout: number;
    initialBatchSizeLoad: number;
    logging: ILogging
}

export interface ILogging {
    react: boolean,
    node: boolean,
    openEdge: string
}
