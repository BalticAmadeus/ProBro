import * as React from "react";
import { createRoot } from "react-dom/client";

import "./query.css";
import { IOETableData } from "../../db/oe";

import DataGrid from "react-data-grid";
import { CommandAction, ICommand, IConfig } from "./model";
import { v1 } from "uuid";
import { domainToUnicode } from "url";

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        tableData: IOETableData;
    }
}

interface IConfigProps {
    vscode: any;
    tableData: IOETableData;
}

interface IConfigState {
    tableData: IOETableData;
}

const vscode = window.acquireVsCodeApi();

function QueryForm({ vscode, tableData, ...props }: IConfigProps) {
    const oldState = vscode.getState();
    const initState = oldState ? oldState : { tableData: tableData };
    const [vsState, setVsState] = React.useState(initState as IConfigState);
    const [wherePhrase, setWherePhrase] = React.useState<string>("");

    React.useEffect(() => {
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.command) {
                case "data":
                    setVsState({ tableData: message.data });
                    console.log(message);
            }
        });
    });

    const onQueryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const command: ICommand = {
            id: v1(),
            action: CommandAction.Query,
            params: { where: wherePhrase },
        };
        vscode.postMessage(command);
    };

    return (
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
                                    value={wherePhrase}
                                    style={{ width: "370px" }}
                                    onChange={(event) => {
                                        setWherePhrase(event.target.value);
                                    }}
                                />
                                <input
                                    type="submit"
                                    value="Query"
                                    onClick={onQueryClick}
                                ></input>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <DataGrid
                columns={vsState.tableData.columns}
                rows={vsState.tableData.data}
                style={{blockSize:"auto"}}
            ></DataGrid>
        </React.Fragment>
    );
}

const root = createRoot(document.getElementById("root"));
root.render(<QueryForm vscode={vscode} tableData={window.tableData} />);
