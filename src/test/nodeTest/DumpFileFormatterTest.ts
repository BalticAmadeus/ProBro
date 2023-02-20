import { IExportDumpData } from "../../db/oe";
import { DumpFileFormatter } from "../../webview/DumpFileFormatter";

export class DumpFileFormatterTest extends DumpFileFormatter {
    public dumpData: string = super.dumpData;
    public trailerInfo: string = super.trailerInfo;
    public dumpFile: string = super.dumpFile;
  
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