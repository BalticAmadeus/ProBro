import { IExportDumpData } from '../../db/Oe';
import { DumpFileFormatter } from '../../webview/DumpFileFormatter';

export class DumpFileFormatterTest extends DumpFileFormatter {
    public declare dumpData: string;
    public declare trailerInfo: string;
    public declare dumpFile: string;

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