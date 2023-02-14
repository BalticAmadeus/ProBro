/* eslint-disable @typescript-eslint/naming-convention */
const path = require("path");
/** @type {import('jest').Config} */
const config = {
    roots: [
        "<rootDir>/src/test/nodeTest"
    ],
    globals: {
        __DEV__: true
      },
    testEnvironment: "./test/nodeTest/vscode-environment.js",
    moduleNameMapper: {
        vscode: path.join(__dirname, 'test-jest', 'vscode.js')  // <----- most important line
      }
    };

    module.exports = config;