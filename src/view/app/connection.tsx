import * as React from "react";
import { createRoot } from "react-dom/client";

import "./connection.css";
import ConnectionForm from "./connectionForm";
import { IConfig } from "./model";

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        initialData: IConfig;
    }
}

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));
root.render(
    <ConnectionForm initialData={window.initialData} vscode={vscode} />
);
