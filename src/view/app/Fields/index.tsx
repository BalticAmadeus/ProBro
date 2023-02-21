import * as React from "react";
import { createRoot } from "react-dom/client";
import "./fields.css";
import Fields from "./fields";
import { IConfig } from "../model";
import { ISettings } from "../../../common/IExtensionSettings";

declare global {
  interface Window {
    acquireVsCodeApi(): any;
    initialData: IConfig;
    configuration: ISettings;
  }
}

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));
root.render(
  <Fields
    initialData={window.initialData}
    configuration={window.configuration}
    vscode={vscode}
  />
);
