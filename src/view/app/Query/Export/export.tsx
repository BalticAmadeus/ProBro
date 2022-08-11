import * as React from "react";
import Popup from "reactjs-popup";
import exportFromJSON from "export-from-json";
import "./export.css";
import { CommandAction, ICommand } from "../../model";
import { v1 } from "uuid";

const contentStyle = {
  maxWidth: "600px",
  width: "90%",
};

export default function ExportPopup({ wherePhrase, vscode }) {
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
        where: wherePhrase,
        start: 0,
        pageLength: 100000,
        exportType: exportFormat,
      },
    };
    vscode.postMessage(command);
  };

  const handleMessage = (event) => {
    const message = event.data;
    switch (message.command) {
      case "export":
        exportFromJSON({
          data: message.data.rawData,
          fileName: message.data.params.tableName,
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
      trigger={<button className="btn"> Export Data </button>}
      modal
      contentStyle={contentStyle}
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
            <button
              className="button"
              onClick={() => {
                getData();
                close();
              }}
            >
              Export
            </button>
            <button
              className="button"
              onClick={() => {
                close();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Popup>
  );
}
