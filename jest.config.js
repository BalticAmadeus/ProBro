/* eslint-disable @typescript-eslint/naming-convention */
const path = require('path');
/** @type {import('jest').Config} */
const config = {
    roots: ['<rootDir>/src/test/nodeTest', '<rootDir>/src/test/viewTest'],
    globals: {
        __DEV__: true,
    },
};

module.exports = config;
