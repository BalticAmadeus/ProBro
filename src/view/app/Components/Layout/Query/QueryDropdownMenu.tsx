import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface QueryDropdownMenuProps {
    anchorEl: HTMLElement | null;
    setAnchorEl: (anchorEl: HTMLElement | null) => void;
    selectedOption: string;
    handleFormat: (format: string) => void;
}

enum FormatType {
    JSON = 'JSON',
    PROGRESS = 'PROGRESS',
}

const QueryDropdownMenu: React.FC<QueryDropdownMenuProps> = ({
    anchorEl,
    setAnchorEl,
    selectedOption,
    handleFormat,
}) => {
    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            sx={{
                '& .MuiPaper-root': {
                    backgroundColor: 'var(--vscode-input-background)',
                    maxWidth: '200px',
                    fontSize: 'small',
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
                    <ListItemIcon>
                        {selectedOption === format && <CheckIcon />}
                    </ListItemIcon>
                    <ListItemText primary={format} />
                </MenuItem>
            ))}
        </Menu>
    );
};

export default QueryDropdownMenu;
