import * as React from "react";
import Popup from "reactjs-popup";
import exportFromJSON from "export-from-json";
import { CommandAction, ICommand } from "../../model";
import { v1 } from "uuid";
import ExportIcon from "@mui/icons-material/FileDownloadTwoTone";
import "./export.css";
import { ProBroButton } from "../Components/button";

export default function ExportPopup({
  wherePhrase,
  vscode,
  sortColumns,
  filters,
}) {
  const [exportFormat, setExportFormat] = React.useState("");

  const exportTypes = ["json", "csv", "xls"];

  const exportList = Object.keys(exportFromJSON.types)
    .filter((key) => isNaN(Number(key)))
    .filter((key) => exportTypes.includes(key))
    .concat("") //add empty option for default value
    .reverse();

  const getData = () => {
    const command: ICommand = {
      id: v1(),
      action: CommandAction.Export,
      params: {
        wherePhrase: wherePhrase,
        start: 0,
        pageLength: 100000,
        lastRowID: "",
        sortColumns: sortColumns,
        filters: filters,
        exportType: exportFormat,
        timeOut: 0,
      },
    };
    vscode.postMessage(command);
  };

  const handleMessage = (event) => {
    const message = event.data;
    switch (message.command) {
      case "export":
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
            Select export format:
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
