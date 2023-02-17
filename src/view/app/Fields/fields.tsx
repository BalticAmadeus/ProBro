import * as React from "react";
import { useState, useMemo } from "react";

import { FieldRow, CommandAction} from "../model";
import DataGrid, { SelectColumn }from "react-data-grid";
import type { SortColumn } from "react-data-grid";
import { Logger } from "../../../common/Logger";

import * as columnName from "./column.json";

const filterCSS: React.CSSProperties = {
  inlineSize: "100%",
  padding: "4px",
  fontSize: "14px",
};

type Comparator = (a: FieldRow, b: FieldRow) => number;
function getComparator(sortColumn: string): Comparator {
    switch (sortColumn) {
        case "order":
        case "extent":
        case "decimals":
        case "rpos":
            return (a, b) => {
                return a[sortColumn] - b[sortColumn];
            };
        case "name":
        case "type":
        case "format":
        case "label":
        case "initial":
        case "columnLabel":
        case "mandatory":
        case "valexp":
        case "valMessage":
        case "helpMsg":
        case "description":
        case "viewAs":
            return (a, b) => {
                return a[sortColumn].localeCompare(b[sortColumn]);
            };
        default:
            throw new Error(`unsupported sortColumn: "${sortColumn}"`);
    }
}

function rowKeyGetter(row: FieldRow) {
    return row.order;
}

function Fields({ initialData, configuration, vscode }) {
    const [rows, setRows] = useState(initialData.fields as FieldRow[]);
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const [selectedRows, setSelectedRows] = useState<ReadonlySet<number>>();
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [filteredRows, setFilteredRows] = useState(rows);

	const logger = new Logger(configuration.logging.react);

    const [filters, _setFilters] = React.useState({
        columns: {},
        enabled: true,
        });
    const filtersRef = React.useRef(filters);
    const setFilters = (data) => {
        filtersRef.current = data;
        _setFilters(data);
    };

    const windowRezise = () => {
        setWindowHeight(window.innerHeight);
    };

	window.addEventListener('contextmenu', e => {
		e.stopImmediatePropagation();
	}, true);

    React.useEffect(() => {
        window.addEventListener("resize", windowRezise);
        return () => {
            window.removeEventListener("resize", windowRezise);
        };
    }, []);

    const sortedRows = useMemo((): readonly FieldRow[] => {
        if (sortColumns.length === 0) {
            return filteredRows;
        }

        return [...filteredRows].sort((a, b) => {
            for (const sort of sortColumns) {
                const comparator = getComparator(sort.columnKey);
                const compResult = comparator(a, b);
                if (compResult !== 0) {
                    return sort.direction === "ASC" ? compResult : -compResult;
                }
            }
            return 0;
        });
    }, [filteredRows, sortColumns]);

	columnName.columns.forEach((column) => {
		column["headerRenderer"] = function ({
		column,
		sortDirection,
		priority,
		onSort,
		isCellSelected,
		}) {
		function handleKeyDown(event) {
			if (event.key === " " || event.key === "Enter") {
			event.preventDefault();
			onSort(event.ctrlKey || event.metaKey);
			}
		}

		function handleClick(event) {
			onSort(event.ctrlKey || event.metaKey);
		}

		function handleInputKeyDown(event) {
			var tempFilters = filters;
			if (event.target.value === "") {
			delete tempFilters.columns[column.key];
			} else {
			tempFilters.columns[column.key] = event.target.value;
			}
			setFilters(tempFilters);

			if (Object.keys(filters.columns).length === 0) {
				setFilteredRows(rows);
			} else {
				setFilteredRows(rows.filter( (row) => {
					for (let [key] of Object.entries(filters.columns)) {
						if(!row[key].toString().toLowerCase().includes(filters.columns[key].toLowerCase())) {
							return false;
						}
					}
					return true;
				}));
			}
		}

		return (
			<React.Fragment>
			<div className={filters.enabled ? "filter-cell" : undefined}>
				<span
				tabIndex={-1}
				style={{
					cursor: "pointer",
					display: "flex",
				}}
				className="rdg-header-sort-cell"
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				>
				<span
					className="rdg-header-sort-name"
					style={{
					flexGrow: "1",
					overflow: "clip",
					textOverflow: "ellipsis",
					}}
				>
					{column.name}
				</span>
				<span>
					<svg
					viewBox="0 0 12 8"
					width="12"
					height="8"
					className="rdg-sort-arrow"
					style={{
						fill: "currentcolor",
					}}
					>
					{sortDirection === "ASC" && <path d="M0 8 6 0 12 8"></path>}
					{sortDirection === "DESC" && <path d="M0 0 6 8 12 0"></path>}
					</svg>
					{priority}
				</span>
				</span>
			</div>
			{filters.enabled && (
				<div className={"filter-cell"}>
				<input
					className="textInput"
					autoFocus={isCellSelected}
					style={filterCSS}
					defaultValue={filters.columns[column.key]}
					onChange={handleInputKeyDown}
				/>
				</div>
			)}
			</React.Fragment>
		);
		};
	});

	React.useLayoutEffect(() => {
		window.addEventListener("message", (event) => {
			const message = event.data;
			logger.log("fields explorer data", message);
			switch (message.command) {
				case "data":
					message.data.fields.forEach(field => {
						if (field.mandatory !== null) {
							field.mandatory = field.mandatory ? "yes" : "no";	
						}						
					});
				setRows(message.data.fields);
				setFilteredRows(message.data.fields);
				setFilters({columns: {},
					enabled: true
				});

				if (message.data.selectedColumns === undefined) {
					setSelectedRows(
						(): ReadonlySet<number> =>
						new Set(message.data.fields.map((field) => field.order))
					);
				} else {
					const selected = message.data.fields.filter((row) =>
						message.data.selectedColumns.includes(row.name)
						);
					setSelectedRows(
						(): ReadonlySet<number> =>
						new Set(selected.map((row) => row.order))
					);
				}
			}
		});
	});

	React.useEffect(() => {
		const obj = {
			action: CommandAction.UpdateColumns,
			columns: rows
				.filter((row) => selectedRows.has(row.order))
				.map((row) => row.name)
		};
		logger.log("fields columns update", obj);		
		vscode.postMessage(obj);
	});

	return (
		<div>
			{rows.length > 0 ? (
			<DataGrid
				columns={[SelectColumn, ...columnName.columns]}
				rows={sortedRows}
				defaultColumnOptions={{
					sortable: true,
					resizable: true,
				}}
				selectedRows={selectedRows}
				headerRowHeight={filters.enabled ? 70 : undefined}
				onSelectedRowsChange={setSelectedRows}
				rowKeyGetter={rowKeyGetter}
				onRowsChange={setRows}
				sortColumns={sortColumns}
				onSortColumnsChange={setSortColumns}
				style={{ height: windowHeight }}
				/>
			) : null}
		</div>
	);
	}

export default Fields;


