import { Box, TextField, Typography } from '@mui/material';
import { Fragment, useState, useEffect } from 'react';
import SortArrowIcon from './SortArrorIcon';
import './FilterStyles.css';

interface ColumnHeaderCellProps {
    column: any;
    sortDirection: 'ASC' | 'DESC';
    priority: number;
    onSort: (multiColumnSort: boolean) => void;
    isCellSelected: boolean;
    filters: any;
    setFilters: (filters: any) => void;
    configuration: any;
    reloadData: (batchSize: number) => void;
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
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            onSort(event.ctrlKey || event.metaKey);
        }
    };

    const handleClick = (event: React.MouseEvent) => {
        onSort(event.ctrlKey || event.metaKey);
    };

    const handleKeyInputTimeout = () => {
        if (timer) {
            clearTimeout(timer);
        }
        setTimer(
            setTimeout(() => {
                reloadData(configuration.initialBatchSizeLoad);
            }, 500)
        );
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
            <Box className={filters.enabled ? 'filter-cell' : undefined}>
                <Box
                    tabIndex={-1}
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                    }}
                    className='rdg-header-sort-cell'
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                >
                    <Typography
                        variant='body2'
                        className='rdg-header-sort-name'
                        style={{
                            flexGrow: '1',
                            overflow: 'clip',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {column.name}
                    </Typography>
                    <SortArrowIcon sortDirection={sortDirection} />
                    {priority}
                </Box>
            </Box>
            {filters.enabled && (
                <Box className='filter-cell'>
                    <TextField
                        className='Filter-css'
                        autoFocus={isCellSelected}
                        variant='outlined'
                        size='small'
                        fullWidth
                        defaultValue={filters.columns[column.key]}
                        onChange={handleInputKeyDown}
                        onKeyDown={testKeyDown}
                    />
                </Box>
            )}
        </Fragment>
    );
};

export default ColumnHeaderCell;
