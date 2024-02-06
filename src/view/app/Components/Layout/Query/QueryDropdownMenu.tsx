import { Box, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';
import { ProBroButton } from '@assets/button';

interface QueryDropdownMenuProps {
    setIsFormatted: (isFormatted: boolean) => void; // Prop to set formatting state in parent
}

enum FormatType {
    JSON = 'JSON',
    PROGRESS = 'PROGRESS',
}

const QueryDropdownMenu: React.FC<QueryDropdownMenuProps> = ({
    setIsFormatted,
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
            <ProBroButton onClick={(event) => setAnchorEl(event.currentTarget)}>
                FORMAT
            </ProBroButton>
            <Menu
                id='format-menu'
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                {Object.values(FormatType).map((format) => (
                    <MenuItem key={format} onClick={() => handleFormat(format)}>
                        <ListItemIcon>
                            {selectedOption === format && <CheckIcon />}
                        </ListItemIcon>
                        <ListItemText primary={format} />
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export default QueryDropdownMenu;