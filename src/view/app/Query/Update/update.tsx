import Popup from 'reactjs-popup';
import { CommandAction, ICommand, ProcessAction } from '../../model';
import AddIcon from '@mui/icons-material/AddTwoTone';
import DeleteIcon from '@mui/icons-material/DeleteTwoTone';
import EditIcon from '@mui/icons-material/EditTwoTone';
import { ProBroButton } from '../../assets/button';
import './update.css';
import { Logger } from '../../../../common/Logger';
import { getVSCodeAPI, getVSCodeConfiguration } from '@utils/vscode';
import { Fragment, useState } from 'react';

export interface UpdatePopupProps {
    selectedRows: Set<string>;
    tableName: string;
    columns: any;
    rows: any;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    action: ProcessAction;
    setAction: React.Dispatch<React.SetStateAction<ProcessAction>>;
    readRow: Array<string>;
    isReadOnly: boolean;
    isWindowSmall: boolean;
}

const UpdatePopup: React.FC<UpdatePopupProps> = ({
    selectedRows,
    tableName,
    columns,
    rows,
    open,
    setOpen,
    action,
    setAction,
    readRow,
    isReadOnly,
    isWindowSmall,
}) => {
    const configuration = getVSCodeConfiguration();
    const defaultTrigger = !!configuration.useWriteTriggers;

    const [useTriggers, setUseTriggers] = useState(defaultTrigger); // !! fixes missing setting issue
    const vscode = getVSCodeAPI();
    const logger = new Logger(configuration.logging.react);
    const table = [];
    const inputs: {
        key: string;
        input: HTMLInputElement;
        valueType: string;
    }[] = [];

    const processRecord = (mode: ProcessAction) => {
        setAction(mode);
        const rowids: string[] = [];
        selectedRows.forEach((element) => {
            rowids.push(element);
        });

        const command: ICommand = {
            id: 'CRUD',
            action: CommandAction.CRUD,
            params: {
                start: 0,
                pageLength: selectedRows.size,
                timeOut: 1000,
                minTime: 1000,
                lastRowID: selectedRows.values().next().value,
                crud: rowids,
                mode: ProcessAction[mode],
            },
        };
        logger.log('crud data request', command);
        vscode.postMessage(command);
    };

    const insertRecord = () => {
        processRecord(ProcessAction.Insert);
    };
    const updateRecord = () => {
        processRecord(ProcessAction.Update);
    };
    const deleteRecord = () => {
        processRecord(ProcessAction.Delete);
    };
    const copyRecord = () => {
        processRecord(ProcessAction.Copy);
    };

    logger.log('crud action', action);
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
                        rows[0][column.key] = '?';
                    }
                    let fieldType = typeof (rows &&
                    rows[0] &&
                    String(rows[0][column.key])
                        ? rows[0][column.key]
                        : '');
                    let fieldValue =
                        rows && rows[0] && String(rows[0][column.key])
                            ? String(rows[0][column.key])
                            : '';

                    table.push(
                        <tr>
                            <td>
                                {column.key === 'ROWID'
                                    ? undefined
                                    : column.name}
                            </td>
                            <td>
                                <input
                                    className='textInput'
                                    type={
                                        column.key !== 'ROWID'
                                            ? undefined
                                            : 'hidden'
                                    }
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
                    if (key !== 'ROWID') {
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
                    input.valueType === 'number'
                        ? Number(input.input.value)
                        : input.valueType === 'boolean'
                        ? input.input.value.toLowerCase() === 'true'
                        : input.input.value,
                defaultValue:
                    input.valueType === 'number'
                        ? Number(input.input.defaultValue)
                        : input.valueType === 'boolean'
                        ? input.input.defaultValue.toLowerCase() === 'true'
                        : input.input.defaultValue,
            });
        });

        const command: ICommand = {
            id: 'Submit',
            action: CommandAction.Submit,
            params: {
                start: 0,
                pageLength: 0,
                timeOut: 1000,
                lastRowID:
                    rows && rows[0] && rows[0]['ROWID'] ? rows[0]['ROWID'] : '',
                crud: rowids,
                data: submitData,
                mode: ProcessAction[action],
                minTime: 0,
                useTriggers: useTriggers,
            },
        };

        setUseTriggers(defaultTrigger);
        logger.log('crud submit data', command);
        vscode.postMessage(command);
    };

    function listenForCheck() {
        const checkbox = document.getElementById(
            'myCheckbox'
        ) as HTMLInputElement;

        checkbox.addEventListener('change', () => {
            setUseTriggers(checkbox.checked);
        });
    }

    return (
        <Fragment>
            <Popup open={open} onClose={() => setOpen(false)} modal>
                {(close) => (
                    <div className='update-modal'>
                        <div className='update-header'>
                            {tableName}, {ProcessAction[action]}
                        </div>
                        <div className='body'>
                            {action === ProcessAction.Delete ? (
                                <div>
                                    Are You sure You want delete{' '}
                                    {selectedRows.size} record
                                    {selectedRows.size > 1 && 's'}?
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
                                            type='checkbox'
                                            id='myCheckbox'
                                            onClick={listenForCheck}
                                            defaultChecked={useTriggers}
                                        />{' '}
                                        Use write trigger
                                    </label>
                                </div>
                            )}
                        </div>
                        <div className='update-btn-container'>
                            {ProcessAction[action] !== 'Read' ? (
                                <ProBroButton
                                    className='button'
                                    onClick={onSubmitClick}
                                >
                                    {ProcessAction[action]}
                                </ProBroButton>
                            ) : null}
                            <ProBroButton
                                className='button'
                                onClick={() => {
                                    setUseTriggers(defaultTrigger);
                                    setOpen(false);
                                }}
                            >
                                Cancel
                            </ProBroButton>
                        </div>
                    </div>
                )}
            </Popup>
            <>
                {!isReadOnly && (
                    <>
                        <ProBroButton
                            startIcon={<AddIcon />}
                            onClick={
                                selectedRows.size === 1
                                    ? copyRecord
                                    : insertRecord
                            }
                            disabled={selectedRows.size > 0 ? false : false}
                        >
                            {isWindowSmall
                                ? ''
                                : selectedRows.size === 1
                                ? 'Copy'
                                : 'Create'}
                        </ProBroButton>
                        <ProBroButton
                            startIcon={<EditIcon />}
                            onClick={updateRecord}
                            disabled={selectedRows.size === 1 ? false : true}
                        >
                            {isWindowSmall ? '' : 'Update'}
                        </ProBroButton>
                        <ProBroButton
                            startIcon={<DeleteIcon />}
                            onClick={deleteRecord}
                            disabled={selectedRows.size > 0 ? false : true}
                        >
                            {isWindowSmall ? '' : 'Delete'}
                        </ProBroButton>
                    </>
                )}
            </>
        </Fragment>
    );
};

export default UpdatePopup;
