import SvgIcon from '@mui/material/SvgIcon';

interface SortArrowIconProps {
    sortDirection: 'ASC' | 'DESC';
}

const SortArrowIcon: React.FC<SortArrowIconProps> = ({ sortDirection }) => (
    <SvgIcon
        sx={{ fill: 'currentcolor', width: 12, height: 8 }}
        viewBox='0 0 12 8'
    >
        {sortDirection === 'ASC' && <path d='M0 8 6 0 12 8' />}
        {sortDirection === 'DESC' && <path d='M0 0 6 8 12 0' />}
    </SvgIcon>
);

export default SortArrowIcon;
