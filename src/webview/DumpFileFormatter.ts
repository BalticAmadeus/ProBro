
export class DumpFileFormatter {

    constructor() {

    }

    public formatDumpFile (data: any, fileName: string, dbName: string) {
        const dumpData = this.formatDumpData(data);
        const trailerInfo = this.formatTrailerInfo(data.PSC, fileName, dbName, data.rawData.length);
        return dumpData 
            + `.\r\n` 
            + trailerInfo
            + `.\r\n` 
            + `${String(dumpData.length + 3).padStart(10, "0")}\r\n`;
    };

    private formatDumpData (data: any): string {
        return data.rawData.reduce((accumulator: string, row: any) => {
            return (
              accumulator +
              Object.entries(row)
                .filter((element) => element[0] !== "ROWID")
                .reduce((accumulator: any, element: any, index) => {
                  if (index > 0 && accumulator.length !== 0) {
                    accumulator += " ";
                  }
                  // typeof null === "object"
                  if (typeof element[1] === "object") {
                    return accumulator + "?";
                  }
                  const column = data.columns.find(
                    (column: { name: string }) => column.name === element[0]
                  );
                  switch (column.type) {
                    case "decimal":
                      if (element[1] < 1 && element[1] > 0) {
                        return accumulator + element[1].toString().slice(1);
                      }
                    case "integer":
                    case "int64":
                      return accumulator + element[1];
                    case "raw":
                    case "character":
                      const formatted = element[1].replace(/\"/g, `""`);
                      return accumulator + `\"${formatted}\"`;
                    case "date":
                      const tempDate = new Date(element[1]);
                      const tempYMD = {
                        y: tempDate.getFullYear().toString().slice(2),
                        m: (tempDate.getMonth() + 1).toString().padStart(2, "0"),
                        d: tempDate.getDate().toString().padStart(2, "0"),
                      };
                      const tempDateFormat = data.PSC.dateformat.substring(0, 3);
                      const date = tempDateFormat
                        .split("")
                        .map((letter: string) => {
                          return tempYMD[letter as keyof typeof tempYMD];
                        })
                        .join("/");
                      return accumulator + date;
                    case "datetime":
                    case "datetime-tz":
                      return accumulator + element[1];
                    case "logical":
                      return accumulator + (element[1] ? "yes" : "no");
                    default:
                      return accumulator.slice(0, -1);
                  }
                }, "") +
              "\r\n"
            );
          }, "");
    }

    private formatTrailerInfo (data: any, fileName: string, dbName: string, recordNum: number): string {
        return `PSC\r\n`
        + `filename=${fileName}\r\n`
        + `records=${String(recordNum).padStart(13, "0")}\r\n`
        + `ldbname=${dbName}\r\n`
        + `timestamp=${data.timestamp}\r\n`
        + `numformat=${data.numformat}\r\n`
        + `dateformat=${data.dateformat}\r\n`
        + `map=NO-MAP\r\n`
        + `cpstream=${data.cpstream}\r\n`;
  
    }

}