import ExportPopup from '@Query/Export';
import { ExportPopupProps } from '@Query/Export/export';
import SavePopup from '@Query/SaveView';
import { SavePopupProps } from '@Query/SaveView/save';
import UpdatePopup from '@Query/Update';
import { UpdatePopupProps } from '@Query/Update/update';
import QueryAutocompleteInput, {
    QueryAutocompleteInputProps,
} from '@app/Components/Layout/Query/QueryAutocompleteInput';
import QueryDropdownMenu from '@app/Components/Layout/Query/QueryDropdownMenu';
import { ProBroButton } from '@assets/button';
import PlayArrowTwoToneIcon from '@mui/icons-material/PlayArrowTwoTone';
import { Box, Stack, Typography } from '@mui/material';
import { MouseEventHandler, useEffect } from 'react';

interface QueryFormHeadProps
    extends QueryAutocompleteInputProps,
        ExportPopupProps,
        UpdatePopupProps,
        SavePopupProps {
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
    setIsFormatted,
    ...otherProps
}) => {
    useEffect(() => {
        if (onLoad) {
            onLoad();
        }
    }, []);

    return (
        <Box>
            <Typography fontSize={'0.8rem'}>Query</Typography>
            <Stack direction={'row'} alignItems={'center'}>
                <QueryAutocompleteInput
                    suggestions={otherProps.suggestions}
                    wherePhrase={otherProps.wherePhrase}
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
                    <QueryDropdownMenu
                        isWindowSmall={isWindowSmall}
                        setIsFormatted={setIsFormatted}
                    />
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
                    <SavePopup
                        isWindowSmall={isWindowSmall}
                        handleSaveClick={otherProps.handleSaveClick}
                    ></SavePopup>
                </Box>
            </Stack>
        </Box>
    );
};

export default QueryFormHead;
