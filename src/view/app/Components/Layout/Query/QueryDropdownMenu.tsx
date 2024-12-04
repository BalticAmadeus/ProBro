import { ProBroButton } from '@assets/button';
import CheckIcon from '@mui/icons-material/Check';
import DnsIcon from '@mui/icons-material/DnsTwoTone';
import { Box, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

interface QueryDropdownMenuProps {
    setIsFormatted: (isFormatted: boolean) => void; // Prop to set formatting state in parent
    isWindowSmall: boolean;
}

enum FormatType {
    JSON = 'JSON',
    PROGRESS = 'PROGRESS',
}

const QueryDropdownMenu: React.FC<QueryDropdownMenuProps> = ({
    setIsFormatted,
    isWindowSmall,
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedOption, setSelectedOption] = useState<FormatType>(
        FormatType.JSON
    );

    const handleFormat = (format: FormatType) => {
        if (format === FormatType.JSON) {
            setIsFormatted(false);
        } else if (format === FormatType.PROGRESS) {
            setIsFormatted(true);
        }
        setSelectedOption(format);
        setAnchorEl(null);
    };

    return (
        <Box display='inline-block'>
            <ProBroButton
                onClick={(event) => setAnchorEl(event.currentTarget)}
                startIcon={<DnsIcon />}
            >
                {!isWindowSmall && 'FORMAT'}
            </ProBroButton>
            <Menu
                id='format-menu'
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: 'var(--vscode-input-background)',
                        size: 'small',
                    },
                }}
            >
                {Object.values(FormatType).map((format) => (
                    <MenuItem
                        key={format}
                        onClick={() => handleFormat(format)}
                        sx={{
                            color: 'var(--vscode-input-foreground)',
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                color: 'var(--vscode-input-foreground)',
                            }}
                        >
                            {selectedOption === format && (
                                <CheckIcon fontSize='small' />
                            )}
                        </ListItemIcon>
                        <ListItemText
                            primary={format}
                            primaryTypographyProps={{
                                sx: { fontSize: '0.8em' },
                            }}
                        />
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export default QueryDropdownMenu;
