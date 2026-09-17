import { IExportDumpData } from '../../db/Oe';
import { DumpFileFormatter } from '../../webview/DumpFileFormatter';

export class DumpFileFormatterTest extends DumpFileFormatter {
    public get dumpData(): string {
        return super.dumpData;
    }
    public set dumpData(value: string) {
        super.dumpData = value;
    }

    public get trailerInfo(): string {
        return super.trailerInfo;
    }
    public set trailerInfo(value: string) {
        super.trailerInfo = value;
    }

    public get dumpFile(): string {
        return super.dumpFile;
    }
    public set dumpFile(value: string) {
        super.dumpFile = value;
    }


    public combineDumpFile() {
        return super.combineDumpFile();
    }

    public formatDumpData(data: IExportDumpData) {
        return super.formatDumpData(data);
    }

    public formatTrailerInfo(
        data: any,
        fileName: string,
        dbName: string,
        recordNum: number
    ) {
        return super.formatTrailerInfo(data, fileName, dbName, recordNum);
    }
}