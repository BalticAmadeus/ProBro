import SortArrowIcon from '@app/Components/Layout/Common/SortArrorIcon';
import { Box, TextField, Typography } from '@mui/material';
import { Fragment, useRef } from 'react';

interface ColumnHeaderCellProps {
    column: any;
    sortDirection: 'ASC' | 'DESC';
    priority: number;
    onSort: (multiColumnSort: boolean) => void;
    isCellSelected: boolean;
    setCellSelected: () => void;
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
    setCellSelected,
    filters,
    setFilters,
    configuration,
    reloadData,
}) => {
    const cellRef = useRef<HTMLDivElement>(null);

    const handleClick = (event: React.MouseEvent) => {
        onSort(event.ctrlKey || event.metaKey);
        setCellSelected();
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            onSort(event.ctrlKey || event.metaKey);
        }
    };

    let timer;
    const handleKeyInputTimeout = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            reloadData(configuration.initialBatchSizeLoad);
        }, 500);
        setCellSelected();
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
                        ref={cellRef}
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
                variant='standard'
                size='small'
                defaultValue={filters.columns[column.key]}
                onChange={handleInputKeyDown}
                onKeyDown={testKeyDown}
                fullWidth={true}
                autoFocus={isCellSelected}
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
