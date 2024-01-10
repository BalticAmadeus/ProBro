import { IErrorObject } from '@app/common/types';

/**
 * Returns if the error is present in error object
 * @param errorObj standard error object
 * @returns true if error
 */
export const isError = (errorObj: IErrorObject): boolean => {
    if (errorObj.error || errorObj.description) {
        return true;
    }
    return false;
};

/**
 * Empty error object
 */
export const emptyErrorObj: IErrorObject = {
    error: '',
    description: '',
    trace: '',
};
