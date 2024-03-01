export interface ISettings {
    batchSize: number;
    batchMaxTimeout: number;
    batchMinTimeout: number;
    initialBatchSizeLoad: number;
    logging: ILogging;
    useWriteTriggers: boolean;
    filterAsYouType: boolean;
    useDeleteTriggers: boolean;
    gridTextSize: string;
}

export interface ILogging {
    react: boolean;
    node: boolean;
    openEdge: string;
}
