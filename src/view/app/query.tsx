import * as React from "react";
import { createRoot } from "react-dom/client";

import "./query.css";
import { IOETableData } from "../../db/oe";

import DataGrid from "react-data-grid";

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        tableData: IOETableData;
    }
}

const vscode = window.acquireVsCodeApi();

const onQueryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // setButtonState(true);
    // const id: string = v1();
    // const config: IConfig = {
    //     id: vsState.config.id,
    //     name: name,
    //     description: description,
    //     host: host,
    //     port: port,
    //     user: user,
    //     password: password,
    //     group: group,
    //     params: params,
    // };
    // const command: ICommand = {
    //     id: id,
    //     action: CommandAction.Query,
    //     content: config,
    // };
    // vscode.postMessage(command);
};

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
                                placeholder="WHERE ..."
                                value=""
                                style={{ width: "370px" }}
                                onClick={onQueryClick}
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
        <DataGrid
            columns={window.tableData.columns}
            rows={window.tableData.data}
        ></DataGrid>
    </React.Fragment>
);
