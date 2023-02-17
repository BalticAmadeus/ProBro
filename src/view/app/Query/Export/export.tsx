import * as React from "react";
import Popup from "reactjs-popup";
import exportFromJSON from "export-from-json";
import { CommandAction, DataToExport, ICommand } from "../../model";
import ExportIcon from "@mui/icons-material/FileDownloadTwoTone";
import "./export.css";
import { ProBroButton } from "../components/button";
import { Logger } from "../../../../common/Logger";


export default function ExportPopup({
  wherePhrase,
  vscode,
  sortColumns,
  filters,
  selectedRows,
  logValue
}) {
  const [exportFormat, setExportFormat] = React.useState("");
  const [radioSelection, setRadioSelection] = React.useState("");
  const logger = new Logger(logValue);
  
  function handleChange ({ currentTarget }:React.ChangeEvent<HTMLInputElement>) {
    setRadioSelection(currentTarget.value);
    console.log(currentTarget.value);
  };



  const exportList = ["json", "csv", "xls", "dumpFile"].concat("").reverse();

  const getData = () => {
    console.log("get data");
    const command: ICommand = {
      id: "GetData",
      action: CommandAction.Export,
    };
    switch (radioSelection) {
      case DataToExport[DataToExport.Table]:
       command.params = {
            wherePhrase: wherePhrase,
            start: 0,
            pageLength: 100000,
            lastRowID: "",
            sortColumns: sortColumns,
            exportType: exportFormat,
            timeOut: 0,
          };
        break;
        case DataToExport[DataToExport.Filter]:
          command.params = {
            wherePhrase: wherePhrase,
            start: 0,
            pageLength: 100000,
            lastRowID: "",
            sortColumns: sortColumns,
            filters: filters,
            exportType: exportFormat,
            timeOut: 0
          };
          break;
        case DataToExport[DataToExport.Selection]:
          const rowids: string[] = [];
          selectedRows.forEach((element) => {
            rowids.push(element);
          });
          command.params = {
            wherePhrase: wherePhrase,
            start: 0,
            pageLength: 100000,
            lastRowID: "",
            sortColumns: sortColumns,
            filters: filters,
            exportType: exportFormat,
            timeOut: 0,
            crud: rowids
          };
          break;
      default:
        break;
    }
    logger.log("export request", command);
    vscode.postMessage(command);
  };

  const handleMessage = (event) => {
    const message = event.data;
    logger.log("got export data", message);
    switch (message.command) {
      case "export":
        if (message.format === "dumpFile") {
          logger.log("dumpfile export got.");
          exportFromJSON({
            data: message.data,
            fileName: message.tableName,
            exportType: exportFromJSON.types.txt,
            extension: "d"
          });
          break;
        }
        const exportData = message.data.rawData.map(({ ROWID, ...rest }) => {
          return rest;
        });
        exportFromJSON({
          data: exportData,
          fileName: message.tableName,
          exportType: exportFromJSON.types[message.format],
        });
    }
  };

  React.useEffect(() => {
    window.addEventListener("message", handleMessage);

    return () => {
      return window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <Popup
      trigger={
        <ProBroButton startIcon={<ExportIcon />}>
          Export
        </ProBroButton>
      }
      modal
    >
      {(close) => (
        <div className="modal">
          <div className="header"> Export to {exportFormat} </div>
          <div className="content">
           <b>Select export format:</b>
            <br />
            <br />
            <select
              id="dropdown"
              onChange={(val) => setExportFormat(val.target.value)}
            >
              {exportList.map((val) => (
                <option value={val}>{val}</option>
              ))}
            </select>
            <br />
            
            <div className="checkbox">  
              <label><b> 
                Data to export:
              </b></label>
              <br/>
              <br/>
              {Object.keys(DataToExport).filter(key => Number.isNaN(+key)).map((key) => (
                <label className="radioBtn">
                  <input type="radio" 
                  name="exportdata"
                  onChange={(e)=> handleChange(e)}
                  value={key}
                  />
                  {key}
                </label>
              ))} 
           </div>
          </div>
          <div className="btn-container">
            <ProBroButton
              className="button"
              onClick={() => {
                getData();
                close();
              }}
            >
              Export
            </ProBroButton>
            <ProBroButton
              className="button"
              onClick={() => {
                close();
              }}
            >
              Cancel
            </ProBroButton>
          </div>
        </div>
      )}
    </Popup>
  );
}
