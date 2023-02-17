export class Logger{

    private readonly isLoggingEnabled: boolean;

    constructor (doLog: boolean){
        this.isLoggingEnabled = doLog;
    }

    log(message: string, additionalData?: any): void{
        if (this.isLoggingEnabled){
            console.log(message, ": ", additionalData);
        }
    }
}