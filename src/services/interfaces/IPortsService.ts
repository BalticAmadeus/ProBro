export interface IPortsService {
  reservePort(): number | undefined;
  releasePort(): boolean;
}
