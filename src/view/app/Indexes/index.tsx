import * as React from "react";

import { createRoot } from "react-dom/client";
import { TableDetails } from "../model";
import "./indexes.css";
import Indexes from "./indexes";
import { ISettings } from "../../../common/IExtensionSettings";

declare global {
  interface Window {
    acquireVsCodeApi(): any;
    tableDetails: TableDetails;
    configuration: ISettings;
  }
}

const root = createRoot(document.getElementById("root"));
root.render(<Indexes tableDetails={window.tableDetails} configuration={window.configuration}/>);
