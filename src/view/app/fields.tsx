import * as React from "react";
import { createRoot } from "react-dom/client";

import "./fields.css";
import { IConfig } from "./model";

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        initialData: IConfig;
    }
}

//const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));
root.render(<b>Custom React page</b>);
