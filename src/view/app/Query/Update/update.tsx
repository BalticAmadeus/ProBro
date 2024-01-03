import * as React from "react";
import Popup from "reactjs-popup";
import { CommandAction, ICommand, ProcessAction } from "../../model";
import AddIcon from "@mui/icons-material/AddTwoTone";
import DeleteIcon from "@mui/icons-material/DeleteTwoTone";
import EditIcon from "@mui/icons-material/EditTwoTone";
import { ProBroButton } from "../../assets/button";
import "./update.css";
import { Logger } from "../../../../common/Logger";

export default function UpdatePopup({
  vscode,
  selectedRows,
  tableName,
  columns,
  rows,
  insertRecord,
  updateRecord,
  deleteRecord,
  copyRecord,
  open,
  setOpen,
  action,
  setAction,
  readRow,
  logValue,
  defaultTrigger,
  isReadOnly,
}) {
  const [isWindowSmall, setIsWindowSmall] = React.useState(false);
  const [useTriggers, setUseTriggers] = React.useState(defaultTrigger);
  const logger = new Logger(logValue);
  const table = [];
  const myClonedArray = [];
  columns.forEach((val) => myClonedArray.push(Object.assign({}, val)));
  const inputs: {
    key: string;
    input: HTMLInputElement;
    valueType: string;
  }[] = [];

  console.log(columns, "DSASDASFDSADFASDFASDFASfd");
  console.log(myClonedArray, "CLONED");

  logger.log("crud action", action);
  if (action !== ProcessAction.Delete) {
    switch (action) {
      case ProcessAction.Update:
      case ProcessAction.Insert:
      case ProcessAction.Copy:
        columns.forEach((column) => {
          if (
            action === ProcessAction.Update &&
            rows !== undefined &&
            rows[0][column.key] === null
          ) {
            rows[0][column.key] = "?";
          }
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
        break;
      case ProcessAction.Read:
        Object.keys(readRow).forEach((key) => {
          if (key !== "ROWID") {
            table.push(
              <tr>
                <td>{key}</td>
                <td>{readRow[key]}</td>
              </tr>
            );
          }
        });
        break;
      default:
        break;
    }
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
          input.valueType === "number"
            ? Number(input.input.value)
            : input.valueType === "boolean"
            ? input.input.value.toLowerCase() === "true"
            : input.input.value,
        defaultValue:
          input.valueType === "number"
            ? Number(input.input.defaultValue)
            : input.valueType === "boolean"
            ? input.input.defaultValue.toLowerCase() === "true"
            : input.input.defaultValue,
      });
    });

    const command: ICommand = {
      id: "Submit",
      action: CommandAction.Submit,
      params: {
        start: 0,
        pageLength: 0,
        timeOut: 1000,
        lastRowID: rows && rows[0] && rows[0]["ROWID"] ? rows[0]["ROWID"] : "",
        crud: rowids,
        data: submitData,
        mode: ProcessAction[action],
        minTime: 0,
        useTriggers: useTriggers,
      },
    };

    setUseTriggers(defaultTrigger);
    logger.log("crud submit data", command);
    vscode.postMessage(command);
  };

  function listenForCheck() {
    const checkbox = document.getElementById("myCheckbox") as HTMLInputElement;

    checkbox.addEventListener("change", () => {
      setUseTriggers(checkbox.checked);
    });
  }

  React.useEffect(() => {
    const handleResize = () => {
      setIsWindowSmall(window.innerWidth <= 828); // Adjust the breakpoint value as needed
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const changeToUpdateMode = () => {
    console.log(
      selectedRows,
      "UPDATEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE"
    );
    updateRecord();
  };

  return (
    <React.Fragment>
      <Popup open={open} onClose={() => setOpen(false)} modal>
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
              ) : action === ProcessAction.Read ? (
                <>
                  <table>
                    <tbody>{table}</tbody>
                  </table>
                </>
              ) : (
                <div>
                  <table>
                    <tbody>{table}</tbody>
                  </table>
                  <label>
                    <input
                      type="checkbox"
                      id="myCheckbox"
                      onClick={listenForCheck}
                      defaultChecked={useTriggers}
                    />{" "}
                    Use write trigger
                  </label>
                </div>
              )}
            </div>
            <div className="update-btn-container">
              {ProcessAction[action] !== "Read" ? (
                <ProBroButton className="button" onClick={onSubmitClick}>
                  {ProcessAction[action]}
                </ProBroButton>
              ) : null}
              <ProBroButton
                className="button"
                onClick={() => {
                  setUseTriggers(defaultTrigger);
                  setOpen(false);
                }}
              >
                Cancel
              </ProBroButton>
              <ProBroButton
                startIcon={<EditIcon />}
                onClick={changeToUpdateMode}
              >
                UPDATE
              </ProBroButton>
            </div>
          </div>
        )}
      </Popup>
      {isWindowSmall ? (
        <>
          {!isReadOnly && (
            <>
              <ProBroButton
                startIcon={<AddIcon />}
                onClick={selectedRows.size === 1 ? copyRecord : insertRecord}
                disabled={selectedRows.size > 0 ? false : false}
              ></ProBroButton>
              <ProBroButton
                startIcon={<EditIcon />}
                onClick={updateRecord}
                disabled={selectedRows.size === 1 ? false : true}
              ></ProBroButton>
              <ProBroButton
                startIcon={<DeleteIcon />}
                onClick={deleteRecord}
                disabled={selectedRows.size > 0 ? false : true}
              ></ProBroButton>
            </>
          )}
        </>
      ) : (
        <>
          {!isReadOnly && (
            <>
              <ProBroButton
                startIcon={<AddIcon />}
                onClick={selectedRows.size === 1 ? copyRecord : insertRecord}
                disabled={selectedRows.size > 0 ? false : false}
              >
                {selectedRows.size === 1 ? "Copy" : "Create"}
              </ProBroButton>
              <ProBroButton
                startIcon={<EditIcon />}
                onClick={updateRecord}
                disabled={selectedRows.size === 1 ? false : true}
              >
                Update'as
              </ProBroButton>
              <ProBroButton
                startIcon={<DeleteIcon />}
                onClick={deleteRecord}
                disabled={selectedRows.size > 0 ? false : true}
              >
                Delete
              </ProBroButton>
            </>
          )}
        </>
      )}
    </React.Fragment>
  );
}
