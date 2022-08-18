import * as React from "react";
import Popup from "reactjs-popup";
import { v1 } from "uuid";
import { CommandAction, ICommand, ProcessAction } from "../../model";
import "./update.css";

export default function UpdatePopup({
    vscode,
    selectedRows,
    tableName,
    columns,
    rows,
    insertRecord,
    updateRecord,
    deleteRecord,
    open,
    setOpen,
    action,
}) {
    const table = [];
    const inputs: { key: string; input: HTMLInputElement }[] = [];

    if (action != ProcessAction.Delete) {
        columns.forEach((column) => {
            let fieldValue =
                rows && rows[0] && rows[0][column.key]
                    ? rows[0][column.key]
                    : "";
            table.push(
                <tr>
                    <td>{column.key === "ROWID" ? undefined : column.name}</td>
                    <td>
                        <input
                            type={column.key !== "ROWID" ? undefined : "hidden"}
                            defaultValue={fieldValue}
                            ref={(input) =>
                                inputs.push({ key: column.key, input: input })
                            }
                        ></input>
                    </td>
                </tr>
            );
        });
    }

    const onSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const submitData: {
            key: string;
            value: string;
            defaultValue: string;
        }[] = [];

        const rowids: string[] = [];
        selectedRows.forEach((element) => {
            rowids.push(element);
        });

        inputs.forEach((input) => {
            submitData.push({
                key: input.key,
                value: input.input.value,
                defaultValue: input.input.defaultValue,
            });
        });

        const command: ICommand = {
            id: v1(),
            action: CommandAction.Submit,
            params: {
                start: 0,
                pageLength: 0,
                timeOut: 1000,
                lastRowID:
                    rows && rows[0] && rows[0]["ROWID"] ? rows[0]["ROWID"] : "",
                crud: rowids,
                data: submitData,
                mode: ProcessAction[action],
            },
        };
        vscode.postMessage(command);
    };

    return (
        <React.Fragment>
            <Popup open={open} modal>
                {(close) => (
                    <div className="update-modal">
                        <div className="update-header">
                            {tableName}, {ProcessAction[action]}
                        </div>
                        <div className="body">
                            {action == ProcessAction.Delete ? (
                                <div>
                                    Are You sure You want delete{" "}
                                    {selectedRows.size} record
                                    {selectedRows.size > 1 && "s"}?
                                </div>
                            ) : (
                                <table>
                                    <tbody>{table}</tbody>
                                </table>
                            )}
                        </div>
                        <div className="update-btn-container">
                            <button className="button" onClick={onSubmitClick}>
                                {ProcessAction[action]}
                            </button>
                            <button
                                className="button"
                                onClick={() => {
                                    setOpen(false);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </Popup>
            <input
                className="btn"
                type="button"
                value="Insert"
                onClick={insertRecord}
                disabled={selectedRows.size > 0 ? false : false}
            ></input>
            <input
                className="btn"
                type="button"
                value="Update"
                onClick={updateRecord}
                disabled={selectedRows.size == 1 ? false : true}
            ></input>
            <input
                className="btn"
                type="button"
                value="Delete"
                onClick={deleteRecord}
                disabled={selectedRows.size > 0 ? false : true}
            ></input>
        </React.Fragment>
    );
}
