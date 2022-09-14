import * as React from "react";
import Popup from "reactjs-popup";
import "./read.css";

export default function readPopup({
  tableName,
  readOpen,
  setReadOpen,
  row,
}) {
  const table = [];

  Object.keys(row).forEach(key => {
    if(key !== "ROWID") {
         table.push(
      <tr>
        <td>{key}</td>
        <td>{row[key]}</td>
      </tr>
    );
    }
  });
      
  return (
    <React.Fragment>
      <Popup open={readOpen} onClose={() => setReadOpen(false)} modal>
        {(close) => (
          <div className="update-modal">
            <div className="update-header">
              {tableName}
            </div>
            <div className="body">
                <table>
                  <tbody>{table}</tbody>
                </table>
            </div>
            <div className="update-btn-container">
              <button
                className="button"
                onClick={() => {
                  setReadOpen(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Popup>
    </React.Fragment>
  );
}
