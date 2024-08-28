export class Logger {
    private readonly isLoggingEnabled: boolean;

    constructor(doLog: boolean) {
        this.isLoggingEnabled = doLog;
    }

    log<T>(message: string, additionalData?: T): void {
        if (this.isLoggingEnabled) {
            console.log(message, ': ', additionalData);
        }
    }
}
