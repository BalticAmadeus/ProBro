import { CommandAction, ICommand, ProcessAction } from '../../model';
import './update.css';
import { Logger } from '../../../../common/Logger';
import { getVSCodeAPI, getVSCodeConfiguration } from '@utils/vscode';
import { Fragment, MouseEvent, ReactNode, useState } from 'react';
import { ProBroButton } from '@assets/button';
import AddIcon from '@mui/icons-material/AddTwoTone';
import DeleteIcon from '@mui/icons-material/DeleteTwoTone';
import EditIcon from '@mui/icons-material/EditTwoTone';
import Popup from 'reactjs-popup';
import {
    Box,
    Checkbox,
    CheckboxProps,
    FormControlLabel,
    Typography,
} from '@mui/material';

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

interface UpdateCheckboxProps extends CheckboxProps {
    children: ReactNode;
}

const UpdateCheckbox: React.FC<UpdateCheckboxProps> = ({
    children,
    ...otherProps
}) => {
    return (
        <Box>
            <FormControlLabel
                label={
                    <Typography sx={{ fontSize: '0.85rem' }}>
                        {children}
                    </Typography>
                }
                control={<Checkbox size='small' {...otherProps} />}
            ></FormControlLabel>
        </Box>
    );
};

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
    const defaultWriteTrigger = configuration.useWriteTriggers;
    const defaultDeleteTrigger = configuration.useDeleteTriggers;

    const [useWriteTriggers, setUseWriteTriggers] =
        useState<boolean>(defaultWriteTrigger);
    const [useDeleteTriggers, setUseDeleteTriggers] =
        useState<boolean>(defaultDeleteTrigger);
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

    if (action >= 0 && action !== ProcessAction.Delete) {
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
                    const fieldType = typeof (rows &&
                    rows[0] &&
                    String(rows[0][column.key])
                        ? rows[0][column.key]
                        : '');
                    const fieldValue =
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
                useWriteTriggers: useWriteTriggers,
                useDeleteTriggers: useDeleteTriggers,
            },
        };

        setUseWriteTriggers(defaultWriteTrigger);
        setUseDeleteTriggers(defaultDeleteTrigger);
        logger.log('crud submit data', command);
        vscode.postMessage(command);
    };

    const onTriggerCheckboxClick = (e: MouseEvent<HTMLButtonElement>) => {
        const target = e.target as HTMLInputElement;

        switch (action) {
            case ProcessAction.Delete:
                setUseDeleteTriggers(target.checked);
                break;
            case ProcessAction.Copy:
            case ProcessAction.Insert:
            case ProcessAction.Update:
                setUseWriteTriggers(target.checked);
                break;
        }
    };

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
                                <Box>
                                    <Typography variant='body1' fontSize={13}>
                                        Are You sure You want delete{' '}
                                        {selectedRows.size} record
                                        {selectedRows.size > 1 && 's'}?
                                    </Typography>
                                    <UpdateCheckbox
                                        defaultChecked={useDeleteTriggers}
                                        onClick={onTriggerCheckboxClick}
                                    >
                                        Use delete trigger
                                    </UpdateCheckbox>
                                </Box>
                            ) : action === ProcessAction.Read ? (
                                <>
                                    <table>
                                        <tbody>{table}</tbody>
                                    </table>
                                </>
                            ) : (
                                <Box>
                                    <table>
                                        <tbody>{table}</tbody>
                                    </table>
                                    <UpdateCheckbox
                                        defaultChecked={useWriteTriggers}
                                        onClick={onTriggerCheckboxClick}
                                    >
                                        Use write trigger
                                    </UpdateCheckbox>
                                </Box>
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
                            ) : (
                                <ProBroButton
                                    className='button'
                                    startIcon={<EditIcon />}
                                    onClick={() => {
                                        setOpen(false);
                                        updateRecord();
                                    }}
                                    disabled={isReadOnly === true ? true : false}
                                >
                                    UPDATE
                                </ProBroButton>
                            )}
                            <ProBroButton
                                className='button'
                                onClick={() => {
                                    setUseWriteTriggers(defaultWriteTrigger);
                                    setUseDeleteTriggers(defaultDeleteTrigger);
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
