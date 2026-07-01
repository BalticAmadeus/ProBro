import * as React from 'react';
import Popup from 'reactjs-popup';
import exportFromJSON from 'export-from-json';
import { CommandAction, DataToExport, ICommand } from '../../model';
import ExportIcon from '@mui/icons-material/FileDownloadTwoTone';
import './export.css';
import { ProBroButton } from '../../assets/button';
import { Logger } from '../../../../common/Logger';
import { SortColumn } from 'react-data-grid';
import { IFilters } from '@app/common/types';
import { getVSCodeAPI } from '@utils/vscode';

export interface ExportPopupProps {
    wherePhrase: string;
    sortColumns: SortColumn[];
    filters: IFilters;
    selectedRows: Set<string>;
    isWindowSmall: boolean;
}

export default function ExportPopup({
    wherePhrase,
    sortColumns,
    filters,
    selectedRows,
    isWindowSmall,
}) {
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [dragging, setDragging] = React.useState(false);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const [exportFormat, setExportFormat] = React.useState('dumpFile');
    const [radioSelection, setRadioSelection] = React.useState(
        Object.keys(DataToExport).filter((key) => Number.isNaN(+key))[0]
    );
    const [isSaving, setIsSaving] = React.useState(false);

    const logValue = window.configuration.logging.react;
    const logger = new Logger(logValue);
    const vscode = getVSCodeAPI();

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e: globalThis.MouseEvent) => {
        if (dragging) {
            setPosition({
                x: e.clientX - offset.x,
                y: e.clientY - offset.y,
            });
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    function handleChange({
        currentTarget,
    }: React.ChangeEvent<HTMLInputElement>) {
        setRadioSelection(currentTarget.value);
        console.log(currentTarget.value);
    }

    function extractRowIds(selectedRows: string[]): string[] {
        const rowids: string[] = [];
        selectedRows.forEach((element) => {
            rowids.push(element);
        });
        return rowids;
    }

    const exportList = ['dumpFile', 'json', 'csv', 'xls'];

    const getData = () => {
        console.log('get data');
        const command: ICommand = {
            id: 'GetData',
            action: CommandAction.Export,
        };
        switch (radioSelection) {
            case DataToExport[DataToExport.Table]:
                command.params = {
                    wherePhrase: wherePhrase,
                    start: 0,
                    pageLength: 100000,
                    lastRowID: '',
                    sortColumns: sortColumns,
                    exportType: exportFormat,
                    timeOut: 0,
                    minTime: 0,
                };
                break;
            case DataToExport[DataToExport.Filter]:
                command.params = {
                    wherePhrase: wherePhrase,
                    start: 0,
                    pageLength: 100000,
                    lastRowID: '',
                    sortColumns: sortColumns,
                    filters: filters,
                    exportType: exportFormat,
                    timeOut: 0,
                    minTime: 0,
                };
                break;
            case DataToExport[DataToExport.Selection]:
                command.params = {
                    wherePhrase: wherePhrase,
                    start: 0,
                    pageLength: 100000,
                    lastRowID: '',
                    sortColumns: sortColumns,
                    filters: filters,
                    exportType: exportFormat,
                    timeOut: 0,
                    crud: extractRowIds(selectedRows),
                    minTime: 0,
                };
                break;
            default:
                break;
        }
        logger.log('export request', command);
        vscode.postMessage(command);
    };

    const handleMessage = (event) => {
        const message = event.data;
        logger.log('got export data', message);
        if (message.command !== 'export') {
            return;
        }

        if (message.format === 'dumpFile') {
            logger.log('dumpfile export got.');
            exportFromJSON({
                data: message.data,
                fileName: message.tableName,
                exportType: exportFromJSON.types.txt,
                extension: 'd',
            });
            setIsSaving(false);
        } else {
            const exportData = message.data.rawData.map(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ({ ROWID, RECID, ...rest }) => {
                    return rest;
                }
            );
            exportFromJSON({
                data: exportData,
                fileName: message.tableName,
                exportType: exportFromJSON.types[message.format],
            });
            setIsSaving(false);
        }
    };

    React.useEffect(() => {
        window.addEventListener('message', handleMessage);

        return () => {
            return window.removeEventListener('message', handleMessage);
        };
    }, []);

    React.useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove as EventListener);
        window.addEventListener('mouseup', handleMouseUp as EventListener);

        return () => {
            window.removeEventListener(
                'mousemove',
                handleMouseMove as EventListener
            );
            window.removeEventListener(
                'mouseup',
                handleMouseUp as EventListener
            );
        };
    }, [dragging, offset]);

    return (
        <Popup
        onClose={() => {
            setPosition({ x: 0, y: 0 });
        }}
            trigger={
                <ProBroButton startIcon={<ExportIcon />}>
                    {isWindowSmall ? '' : 'Export'}
                </ProBroButton>
            }
            modal
        >
            {(close) => (
                <div
                    className='modal'
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                    }}
                >
                    <div
                        className='header'
                        onMouseDown={handleMouseDown}
                        style={{ userSelect: 'none' }}
                    >
                        {' '}
                        Export to {exportFormat}{' '}
                    </div>
                    <div className='content'>
                        <b>Select export format:</b>
                        <br />
                        <br />
                        <select
                            id='dropdown'
                            onChange={(val) =>
                                setExportFormat(val.target.value)
                            }
                            value={exportFormat}
                        >
                            {exportList.map((val) => (
                                <option key={val} value={val}>
                                    {val}
                                </option>
                            ))}
                        </select>
                        <br />
                        <div className='checkbox'>
                            <label>
                                <b>Data to export:</b>
                            </label>
                            <br />
                            <br />
                            {Object.keys(DataToExport)
                                .filter((key) => Number.isNaN(+key))
                                .map((key) => (
                                    <label className='radioBtn' key={key}>
                                        <input
                                            type='radio'
                                            name='exportdata'
                                            onChange={(e) => handleChange(e)}
                                            value={key}
                                            checked={radioSelection === key}
                                        />
                                        {key}
                                    </label>
                                ))}
                        </div>
                    </div>
                    <div className='btn-container'>
                        <ProBroButton
                            className='button'
                            onClick={() => {
                                setIsSaving(true);
                                getData();
                            }}
                            disabled={isSaving}
                        >
                            Export
                        </ProBroButton>

                        <ProBroButton
                            className='button'
                            onClick={() => close()}
                        >
                            Cancel
                        </ProBroButton>
                    </div>
                    {isSaving ? (
                        <span className='export-saving'>Saving...</span>
                    ) : null}
                </div>
            )}
        </Popup>
    );
}
