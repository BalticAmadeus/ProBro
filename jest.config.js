/* eslint-disable @typescript-eslint/naming-convention */
const { pathsToModuleNameMapper } = require('ts-jest/utils');

/** @type {import('jest').Config} */
const config = {
    roots: ['<rootDir>/src/test/nodeTest', '<rootDir>/src/test/viewTest'],
    globals: {
        __DEV__: true,
    },
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
};