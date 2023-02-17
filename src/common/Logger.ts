export class Logger{

    private readonly doLog: boolean;

    constructor (doLog: boolean){
        this.doLog = doLog;
    }

    log(message: string, additionalData?: any): void{
        if (this.doLog){
            console.log(message, ": ", additionalData);
        }
    }
}