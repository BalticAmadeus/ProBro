import * as React from "react";
import Popup from "reactjs-popup";
import exportFromJSON from "export-from-json";
import { CommandAction, DataToExport, ICommand } from "../../model";
import ExportIcon from "@mui/icons-material/FileDownloadTwoTone";
import "./export.css";
import { ProBroButton } from "../../assets/button";
import { Logger } from "../../../../common/Logger";

export default function ExportPopup({
  wherePhrase,
  vscode,
  sortColumns,
  filters,
  selectedRows,
  logValue
}) {
  const [exportFormat, setExportFormat] = React.useState("dumpFile");
  const [radioSelection, setRadioSelection] = React.useState(
    Object.keys(DataToExport).filter((key) => Number.isNaN(+key))[0]
  );
  const [isWindowSmall, setIsWindowSmall] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const logger = new Logger(logValue);

  function handleChange({ currentTarget }: React.ChangeEvent<HTMLInputElement>) {
    setRadioSelection(currentTarget.value);
    console.log(currentTarget.value);
  };

  const exportList = ["dumpFile", "json", "csv", "xls"];

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
          minTime: 0,
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
          timeOut: 0,
          minTime: 0,
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
          crud: rowids,
          minTime: 0
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
            extension: "d",
          });
          setIsSaving(false);
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
        setIsSaving(false);
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    window.addEventListener("message", handleMessage);

    return () => {
      return window.removeEventListener("message", handleMessage);
    };
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      setIsWindowSmall(window.innerWidth <= 828); // Adjust the breakpoint value as needed
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Popup
      trigger={isWindowSmall ? (
        <ProBroButton startIcon={<ExportIcon />} />
      ) : (
        <ProBroButton
          startIcon={<ExportIcon />}
        >
          Export
        </ProBroButton>
      )

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
              value={exportFormat}
            >
              {exportList.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <br />

            <div className="checkbox">
              <label><b>
                Data to export:
              </b></label>
              <br />
              <br />
              {Object.keys(DataToExport).filter(key => Number.isNaN(+key)).map((key) => (
                <label className="radioBtn" key={key}>
                  <input type="radio"
                    name="exportdata"
                    onChange={(e) => handleChange(e)}
                    value={key}
                    checked={radioSelection === key}
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
                setIsSaving(true);
                getData();
              }}
              disabled={isSaving}
            >
              Export
            </ProBroButton>
            <ProBroButton className="button" onClick={() => close()}>
              Cancel
            </ProBroButton>
          </div>
          {isSaving ? (
            <span className="export-saving">Saving...</span>
          ) : null}
        </div>
      )}
    </Popup>
  );
}