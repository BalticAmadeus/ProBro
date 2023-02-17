import * as React from "react";

import { createRoot } from "react-dom/client";
import { IConfig } from "../model";
import "./indexes.css";
import Indexes from "./indexes";

declare global {
  interface Window {
    acquireVsCodeApi(): any;
    initialData: IConfig;
    configuration: any;
  }
}

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));
root.render(<Indexes initialData={window.initialData} configuration={window.configuration} vscode={vscode} />);
