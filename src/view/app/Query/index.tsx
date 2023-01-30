import * as React from "react";
import { createRoot } from "react-dom/client";

import "./query.css";
import QueryForm from "./query";
import { IOETableData } from "../../../db/oe";

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        tableData: IOETableData;
        tableName: string;
        configuration: any;
    }
}

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById("root"));
root.render(
    <QueryForm
        vscode={vscode}
        tableData={window.tableData}
        tableName={window.tableName}
        configuration={window.configuration}
    />
);
