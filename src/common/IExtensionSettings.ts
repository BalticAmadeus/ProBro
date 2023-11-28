export interface ISettings {
  batchSize: number;
  batchMaxTimeout: number;
  batchMinTimeout: number;
  initialBatchSizeLoad: number;
  logging: ILogging;
  useWriteTriggers: boolean;
  useDeleteTriggers: boolean;
  filterAsYouType: boolean;
}

export interface ILogging {
  react: boolean;
  node: boolean;
  openEdge: string;
}
