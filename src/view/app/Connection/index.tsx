import * as React from "react";
import { createRoot } from "react-dom/client";

import "./connection.css";
import ConnectionForm from "./connectionForm";
import { IConfig } from "../model";

declare global {
  interface Window {
    acquireVsCodeApi(): any;
    initialData: IConfig;
    configuration: any;
  }
}

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));
root.render(
  <ConnectionForm
    initialData={window.initialData}
    configuration={window.configuration}
    vscode={vscode}
  />
);
