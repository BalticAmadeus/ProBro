import { IErrorObject } from '@app/common/types';
import { Box, Typography } from '@mui/material';
import { red } from '@mui/material/colors';
import { isError } from '@utils/errorHelper';

interface ErrorFooterProps {
    errorObj: IErrorObject;
}

interface QueryFormFooterProps extends ErrorFooterProps {
    totalRecords: string | number;
    newRecords: number;
    retrievalTime: number;
    showRecentNumbers: boolean;
    recordColor?: string;
    show?: boolean;
}

const ErrorTypography = ({ children }) => (
    <Typography sx={{ color: red[600] }} variant='overline'>
        {children}
    </Typography>
);

/**
 * Error part for the QueryFormFooter
 * @component ErrorFooter
 */
const ErrorFooter: React.FC<ErrorFooterProps> = ({ errorObj }) => {
    return (
        <Box>
            <ErrorTypography>
                Error: {errorObj.error}
                <br />
                Description: {errorObj.description}
            </ErrorTypography>
        </Box>
    );
};

/**
 * Table Query form footer
 * @component QueryFormFooter
 */
const QueryFormFooter: React.FC<QueryFormFooterProps> = ({
    errorObj,
    totalRecords,
    newRecords,
    retrievalTime,
    showRecentNumbers,
    recordColor = '',
    show = true,
}) => {
    if (isError(errorObj)) {
        return <ErrorFooter errorObj={errorObj} />;
    }
    if (!show) {
        return <></>;
    }
    return (
        <div className='footer'>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                }}
            >
                <pre style={{ marginRight: 'auto' }}>
                    {'Records in grid: '}
                    <span style={{ color: recordColor }}>{totalRecords}</span>
                    {/* <span>{totalRecords}</span> */}
                </pre>
                {showRecentNumbers ? null : (
                    <pre style={{ marginLeft: 'auto' }}>
                        {`Recent records numbers: ${newRecords}`}
                    </pre>
                )}
                <pre style={{ marginLeft: 'auto' }}>
                    {`Recent retrieval time: ${retrievalTime}`} ms
                </pre>
            </div>
        </div>
    );
};

export default QueryFormFooter;
