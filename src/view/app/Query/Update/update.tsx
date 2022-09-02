import * as React from "react";
import Popup from "reactjs-popup";
import { v1 } from "uuid";
import { CommandAction, ICommand, ProcessAction } from "../../model";
import AddIcon from "@mui/icons-material/AddTwoTone";
import DeleteIcon from "@mui/icons-material/DeleteTwoTone";
import EditIcon from "@mui/icons-material/EditTwoTone";
import { ProBroButton } from "../Components/button";
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
  const inputs: {
    key: string;
    input: HTMLInputElement;
    valueType: string;
  }[] = [];

  if (action !== ProcessAction.Delete) {
    columns.forEach((column) => {
      let fieldType = typeof (rows && rows[0] && String(rows[0][column.key])
        ? rows[0][column.key]
        : "");
      let fieldValue =
        rows && rows[0] && String(rows[0][column.key])
          ? String(rows[0][column.key])
          : "";

      table.push(
        <tr>
          <td>{column.key === "ROWID" ? undefined : column.name}</td>
          <td>
            <input
              className="textInput"
              type={column.key !== "ROWID" ? undefined : "hidden"}
              defaultValue={fieldValue}
              ref={(input) =>
                inputs.push({
                  key: column.key,
                  input: input,
                  valueType: fieldType,
                })
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
      value: string | number | boolean;
      defaultValue: string | number | boolean;
    }[] = [];

    const rowids: string[] = [];
    selectedRows.forEach((element) => {
      rowids.push(element);
    });

    inputs.forEach((input) => {
      submitData.push({
        key: input.key,
        value:
          input.valueType == "number"
            ? Number(input.input.value)
            : input.valueType == "boolean"
            ? input.input.value.toLowerCase() === "true"
            : input.input.value,
        defaultValue:
          input.valueType == "number"
            ? Number(input.input.defaultValue)
            : input.valueType == "boolean"
            ? input.input.defaultValue.toLowerCase() === "true"
            : input.input.defaultValue,
      });
    });

    const command: ICommand = {
      id: v1(),
      action: CommandAction.Submit,
      params: {
        start: 0,
        pageLength: 0,
        timeOut: 1000,
        lastRowID: rows && rows[0] && rows[0]["ROWID"] ? rows[0]["ROWID"] : "",
        crud: rowids,
        data: submitData,
        mode: ProcessAction[action],
      },
    };
    console.log(command);
    vscode.postMessage(command);
  };

  const closeModal = () => {
    setOpen(false);
  };


  //add to popup tags:
  //onClose={closeModal} - to close popup on click outside
  //closeOnDocumentClick={false} - to keep oper popup,but all the background is still active(datagrid, buttons, selection)
  return (
    <React.Fragment>
      <Popup open={open} onClose={closeModal} modal>
        {(close) => (
          <div className="update-modal">
            <div className="update-header">
              {tableName}, {ProcessAction[action]}
            </div>
            <div className="body">
              {action === ProcessAction.Delete ? (
                <div>
                  Are You sure You want delete {selectedRows.size} record
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
      <ProBroButton
        startIcon={<AddIcon />}
        onClick={insertRecord}
        disabled={selectedRows.size > 0 ? false : false}
      >Create</ProBroButton>
      <ProBroButton
        startIcon={<EditIcon />}
        onClick={updateRecord}
        disabled={selectedRows.size === 1 ? false : true}
      >Update</ProBroButton>
      <ProBroButton
        startIcon={<DeleteIcon />}
        onClick={deleteRecord}
        disabled={selectedRows.size > 0 ? false : true}
      >Delete</ProBroButton>
    </React.Fragment>
  );
}
