import { Box, Grid, Typography, TypographyProps } from '@mui/material';
import { red } from '@mui/material/colors';
import { IErrorObject, isError } from '@utils/error';

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

const MonospaceTypography: React.FC<TypographyProps> = ({
    children,
    ...otherProps
}) => (
    <Typography fontFamily={'monospace'} fontSize={'0.8rem'} {...otherProps}>
        {children}
    </Typography>
);

const ErrorTypography: React.FC<TypographyProps> = ({
    children,
    ...otherProps
}) => (
    <MonospaceTypography sx={{ color: red[600] }} {...otherProps}>
        {children}
    </MonospaceTypography>
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
        <Box className='footer' sx={{ padding: '2px' }}>
            <Grid
                container
                spacing={0}
                direction='row'
                justifyContent='space-between'
                alignItems='flex-start'
            >
                <Grid item>
                    <MonospaceTypography>
                        Records in grid:{' '}
                        <MonospaceTypography
                            component='span'
                            sx={{ color: recordColor, display: 'inline-block' }}
                        >
                            {recordColor === red[500] ? '> ' : ''}
                            {totalRecords}
                        </MonospaceTypography>
                    </MonospaceTypography>
                </Grid>
                {showRecentNumbers ? null : (
                    <Grid item>
                        <MonospaceTypography>
                            Recent records numbers: {newRecords}
                        </MonospaceTypography>
                    </Grid>
                )}
                <Grid item>
                    <MonospaceTypography>
                        Recent retrieval time: {retrievalTime} ms
                    </MonospaceTypography>
                </Grid>
            </Grid>
        </Box>
    );
};

export default QueryFormFooter;
