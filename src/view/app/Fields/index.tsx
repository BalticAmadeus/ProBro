import * as React from "react";
import { createRoot } from "react-dom/client";
import "./fields.css";
import Fields from "./fields";
import { TableDetails } from "../model";
import { ISettings } from "../../../common/IExtensionSettings";

declare global {
  interface Window {
    acquireVsCodeApi(): any;
    tableDetails: TableDetails;
    configuration: ISettings;
  }
}

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));
root.render(
  <Fields
    tableDetails={window.tableDetails}
    configuration={window.configuration}
    vscode={vscode}
  />
);
