import { Box, TextField, Typography } from '@mui/material';
import { Fragment } from 'react';
import SortArrowIcon from '../Common/SortArrorIcon';

interface ColumnHeaderCellProps {
    column: any;
    sortDirection: 'ASC' | 'DESC';
    priority: number;
    onSort: (multiColumnSort: boolean) => void;
    isCellSelected: boolean;
    filters: any;
    setFilters: (filters: any) => void;
    configuration: any;
    reloadData?: (batchSize: number) => void;
}

const ColumnHeaderCell: React.FC<ColumnHeaderCellProps> = ({
    column,
    sortDirection,
    priority,
    onSort,
    isCellSelected,
    filters,
    setFilters,
    configuration,
    reloadData,
}) => {
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            onSort(event.ctrlKey || event.metaKey);
        }
    };

    const handleClick = (event: React.MouseEvent) => {
        onSort(event.ctrlKey || event.metaKey);
    };

    let timer;
    const handleKeyInputTimeout = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            reloadData(configuration.initialBatchSizeLoad);
        }, 500);
    };

    const testKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            reloadData(configuration.initialBatchSizeLoad);
        }
    };

    const handleInputKeyDown = (event) => {
        const tempFilters = filters;
        tempFilters.columns[column.key] = event.target.value;
        setFilters(tempFilters);
        if (configuration.filterAsYouType === true) {
            handleKeyInputTimeout();
        }
    };
    return (
        <Fragment>
            {filters.enabled && (
                <Box>
                    <Box
                        tabIndex={-1}
                        onClick={handleClick}
                        onKeyDown={handleKeyDown}
                        display='flex'
                        alignItems='center'
                        sx={{
                            height: '35px',
                            padding: '0',
                            cursor: 'pointer',
                        }}
                    >
                        <Typography
                            fontSize={'0.8rem'}
                            fontWeight={'bold'}
                            flexGrow={1}
                        >
                            {column.name}
                        </Typography>
                        <SortArrowIcon sortDirection={sortDirection} />
                        {priority}
                    </Box>
                </Box>
            )}
            <TextField
                autoFocus={isCellSelected}
                variant='standard'
                size='small'
                defaultValue={filters.columns[column.key]}
                onChange={handleInputKeyDown}
                onKeyDown={testKeyDown}
                fullWidth={true}
                InputProps={{ disableUnderline: true }}
                sx={{
                    '& .MuiInputBase-input': {
                        fontSize: '0.8rem',
                        padding: '4px',
                        backgroundColor: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                    },
                }}
            />
        </Fragment>
    );
};

export default ColumnHeaderCell;
