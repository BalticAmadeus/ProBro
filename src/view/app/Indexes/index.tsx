import * as React from "react";

import { createRoot } from "react-dom/client";
import { IConfig } from "../model";
import "./indexes.css";
import Indexes from "./indexes";


declare global {
    interface Window {
        acquireVsCodeApi(): any;
        initialData: IConfig;
    }
};

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));
root.render(<Indexes initialData={window.initialData} vscode={vscode} />);