import * as React from "react";
import { createRoot } from "react-dom/client";

import "./query.css";
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
    <React.Fragment>
        <div className="container">
            <div className="title">Query</div>
            <div className="content">
                <form action="#">
                    <div className="connection-details">
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="FOR EACH ..."
                                value=""
                                style={{ width: "370px" }}
                                onChange={(event) => {
                                    console.log(event);
                                }}
                            />
                            <button>Query</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </React.Fragment>
);
