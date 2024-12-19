export interface IClient {
    sendRequest(cmd: string): Promise<string>;
}
