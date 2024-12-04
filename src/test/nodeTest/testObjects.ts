import { IExportDumpData } from '@src/db/Oe';

export const testObjInput: IExportDumpData = {
    columns: [
        {
            name: 'ROWID',
            key: 'ROWID',
            label: 'ROWID',
            type: 'ROWID',
            format: null,
        },
        {
            name: 'testCharacter',
            key: 'testCharacter',
            label: 'testCharacter',
            type: 'character',
            format: 'x(10)',
        },
        {
            name: 'testDecimal',
            key: 'testDecimal',
            label: 'testDecimal',
            type: 'decimal',
            format: '->,>>>,>>9.99',
        },
        {
            name: 'testInt',
            key: 'testInt',
            label: 'testInt',
            type: 'integer',
            format: '>>9',
        },
        {
            name: 'testIntPercent',
            key: 'testIntPercent',
            label: 'testIntPercent',
            type: 'integer',
            format: '>>9%',
        },
        {
            name: 'testInt64',
            key: 'testInt64',
            label: 'testInt64',
            type: 'int64',
            format: '>>>>>>>>>>>>>>>>>>9',
        },
        {
            name: 'testRaw',
            key: 'testRaw',
            label: 'testRaw',
            type: 'raw',
            format: 'x(8)',
        },
        {
            name: 'testDate',
            key: 'testDate',
            label: 'testDate',
            type: 'date',
            format: '99/99/9999',
        },
        {
            name: 'testDatetime',
            key: 'testDatetime',
            label: 'testDatetime',
            type: 'datetime',
            format: '99/99/9999 HH:MM:SS',
        },
        {
            name: 'testLogical',
            key: 'testLogical',
            label: 'testLogical',
            type: 'logical',
            format: 'TRUE/FALSE',
        },
    ],
    psc: {
        cpstream: 'UTF-8',
        dateformat: 'mdy-1950',
        numformat: '44,46',
        timestamp: '2023/02/20-15:36:36',
    },
    rawData: [
        {
            ROWID: '0x0000000000002c01',
            testCharacter: 'record no.1',
            testDecimal: 0.01,
            testInt: 123,
            testIntPercent: 15,
            testInt64: 12345678901234567890n,
            testRaw: 'AAMBAQEBAQEBAQEBAQA=',
            testDate: '2023-02-20',
            testDatetime: '2023-02-20T11:11:11.111',
            testLogical: true,
        },
        {
            ROWID: '0x0000000000002c02',
            testCharacter: 'record no.2',
            testDecimal: 0.11,
            testInt: 123,
            testIntPercent: 15,
            testInt64: 12345678901234567890n,
            testRaw: 'AAMBAQEBAQEBAQEBAQA=',
            testDate: '2023-02-20',
            testDatetime: '2023-02-20T11:11:11.111',
            testLogical: false,
        },
        {
            ROWID: '0x0000000000002c03',
            testCharacter: 'record no.3',
            testDecimal: 0.22,
            testInt: -123,
            testIntPercent: 15,
            testInt64: 12345678901234567890n,
            testRaw: 'AAMBAQEBAQEBAQEBAQA=',
            testDate: '2023-02-20',
            testDatetime: '2023-02-20T11:11:11.111',
            testLogical: true,
        },
        {
            ROWID: '0x0000000000002c04',
            testCharacter: 'record no.4',
            testDecimal: 0.33,
            testInt: 123,
            testIntPercent: 15,
            testInt64: 12345678901234567890n,
            testRaw: 'AAMBAQEBAQEBAQEBAQA=',
            testDate: '2023-02-20',
            testDatetime: '2023-02-20T11:11:11.111',
            testLogical: false,
        },
    ],
};

export const testOutputDumpData: string =
    '"record no.1" .01 123 15 12345678901234567000 "AAMBAQEBAQEBAQEBAQA=" 02/20/23 2023-02-20T11:11:11.111 yes\r\n' +
    '"record no.2" .11 123 0.15 12345678901234567000 "AAMBAQEBAQEBAQEBAQA=" 02/20/23 2023-02-20T11:11:11.111 no\r\n' +
    '"record no.3" .22 -123 15 12345678901234567000 "AAMBAQEBAQEBAQEBAQA=" 02/20/23 2023-02-20T11:11:11.111 yes\r\n' +
    '"record no.4" .33 123 15 12345678901234567000 "AAMBAQEBAQEBAQEBAQA=" 02/20/23 2023-02-20T11:11:11.111 no\r\n';

export const testOutputTrailerInfo: string =
    'PSC\r\n' +
    'filename=testing\r\n' +
    'records=0000000000004\r\n' +
    'ldbname=testDb\r\n' +
    'timestamp=2023/02/20-15:36:36\r\n' +
    'numformat=44,46\r\n' +
    'dateformat=mdy-1950\r\n' +
    'map=NO-MAP\r\n' +
    'cpstream=UTF-8\r\n';
