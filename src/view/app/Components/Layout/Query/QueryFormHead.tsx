import ExportPopup from '@Query/Export';
import { ExportPopupProps } from '@Query/Export/export';
import { ProBroButton } from '@assets/button';
import PlayArrowTwoToneIcon from '@mui/icons-material/PlayArrowTwoTone';
import { MouseEventHandler, useEffect } from 'react';
import UpdatePopup from '@Query/Update';
import { UpdatePopupProps } from '@Query/Update/update';
import CheckIcon from '@mui/icons-material/Check';
import {
    Box,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Typography,
} from '@mui/material';
import QueryAutocompleteInput, {
    QueryAutocompleteInputProps,
} from './QueryAutocompleteInput';
import * as React from 'react';

interface QueryFormHeadProps
    extends QueryAutocompleteInputProps,
        ExportPopupProps,
        UpdatePopupProps {
    isWindowSmall: boolean;
    onLoad?: () => void;
    onButtonClick?: MouseEventHandler<HTMLButtonElement>;
    formatButtonOnClick: MouseEventHandler<HTMLButtonElement>;
    isFormatted: boolean;
    setIsFormatted: (value: boolean) => void;
}

/**
 * Table Query form head
 * @component QueryFormHead
 */
const QueryFormHead: React.FC<QueryFormHeadProps> = ({
    isWindowSmall,
    onLoad,
    onButtonClick,
    formatButtonOnClick,
    isFormatted,
    setIsFormatted,
    ...otherProps
}) => {
    useEffect(() => {
        if (onLoad) {
            onLoad();
        }
    }, []);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [selectedOption, setSelectedOption] = React.useState('JSON');

    const handleFormat = (format) => {
        if (format === 'JSON') {
            setIsFormatted(false);
        } else if (format === 'PROGRESS') {
            setIsFormatted(true);
        }
        setSelectedOption(format);
        setAnchorEl(null);
    };

    return (
        <Box>
            <Typography fontSize={'0.8rem'}>Query</Typography>
            <Stack direction={'row'} alignItems={'center'}>
                <QueryAutocompleteInput
                    suggestions={otherProps.suggestions}
                    setWherePhrase={otherProps.setWherePhrase}
                    onEnter={otherProps.onEnter}
                ></QueryAutocompleteInput>
                <Box minWidth={isWindowSmall ? '400px' : '550px'}>
                    <ProBroButton
                        startIcon={<PlayArrowTwoToneIcon />}
                        onClick={onButtonClick}
                    >
                        {isWindowSmall ? '' : 'Query'}
                    </ProBroButton>
                    <ExportPopup
                        wherePhrase={otherProps.wherePhrase}
                        sortColumns={otherProps.sortColumns}
                        filters={otherProps.filters}
                        selectedRows={otherProps.selectedRows}
                        isWindowSmall={isWindowSmall}
                    />
                    <>
                        <ProBroButton
                            onClick={(event) =>
                                setAnchorEl(event.currentTarget)
                            }
                        >
                            FORMAT
                        </ProBroButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                            sx={{
                                '& .MuiPaper-root': {
                                    backgroundColor:
                                        'var(--vscode-input-background)',
                                    maxWidth: '200px',
                                    fontSize: 'small',
                                },
                            }}
                        >
                            <MenuItem
                                onClick={() => handleFormat('JSON')}
                                sx={{
                                    color: 'var(--vscode-input-foreground)',
                                }}
                            >
                                <ListItemIcon>
                                    {selectedOption === 'JSON' && <CheckIcon />}
                                </ListItemIcon>
                                <ListItemText primary='JSON' />
                            </MenuItem>
                            <MenuItem
                                onClick={() => handleFormat('PROGRESS')}
                                sx={{
                                    color: 'var(--vscode-input-foreground)',
                                }}
                            >
                                <ListItemIcon>
                                    {selectedOption === 'PROGRESS' && (
                                        <CheckIcon />
                                    )}
                                </ListItemIcon>
                                <ListItemText primary='Progress' />
                            </MenuItem>
                        </Menu>
                    </>
                    <UpdatePopup
                        selectedRows={otherProps.selectedRows}
                        columns={otherProps.columns}
                        rows={otherProps.rows}
                        tableName={otherProps.tableName}
                        open={otherProps.open}
                        setOpen={otherProps.setOpen}
                        action={otherProps.action}
                        setAction={otherProps.setAction}
                        readRow={otherProps.readRow}
                        isReadOnly={otherProps.isReadOnly}
                        isWindowSmall={isWindowSmall}
                    ></UpdatePopup>
                </Box>
            </Stack>
        </Box>
    );
};

export default QueryFormHead;
