import { expect, jest, test } from '@jest/globals';
import { assert } from 'console';
import { DumpFileFormatterTest } from './DumpFileFormatterTest';
import {
    testObjInput,
    testOutputDumpData,
    testOutputTrailerInfo,
} from './testObjects';

afterEach(() => {
    jest.restoreAllMocks();
});

test('formatDumpFile calls other methods ', () => {
    const dumpFileFormatterTest = new DumpFileFormatterTest();
    const spyDumpData = jest.spyOn(dumpFileFormatterTest, 'formatDumpData');
    const spyTrailerInfo = jest.spyOn(
        dumpFileFormatterTest,
        'formatTrailerInfo'
    );
    const spyDumpFile = jest.spyOn(dumpFileFormatterTest, 'combineDumpFile');

    dumpFileFormatterTest.formatDumpFile(testObjInput, 'test', 'test');
    expect(spyDumpData).toHaveBeenCalled();
    expect(spyTrailerInfo).toHaveBeenCalled();
    expect(spyDumpFile).toHaveBeenCalled();
});

test('getDumpFile method returns dumpFile', () => {
    const dumpFileFormatterTest = new DumpFileFormatterTest();
    dumpFileFormatterTest.dumpFile = 'dumpFile';
    assert('dumpFile', dumpFileFormatterTest.getDumpFile());
});

test('combineDumpFile combines data to dump file in right format', () => {
    const dumpFileFormatterTest = new DumpFileFormatterTest();
    dumpFileFormatterTest.dumpData = 'test dump Data';
    dumpFileFormatterTest.trailerInfo = 'test trailer info';
    dumpFileFormatterTest.combineDumpFile();

    const testReturnValue =
        'test dump Data\r\n' +
        '.\r\n' +
        'test trailer info\r\n' +
        '.\r\n' +
        '0000000021';

    assert(testReturnValue, dumpFileFormatterTest.dumpFile);
});

test('formatDumpData formatted correctly with add data types', () => {
    const dumpFileFormatterTest = new DumpFileFormatterTest();
    dumpFileFormatterTest.formatDumpData(testObjInput);
    assert(testOutputDumpData, dumpFileFormatterTest.dumpData);
});

test('formatTrailerInfo formatted correctly', () => {
    const dumpFileFormatterTest = new DumpFileFormatterTest();
    dumpFileFormatterTest.formatTrailerInfo(
        testObjInput.psc,
        'testing',
        'testDb',
        4
    );
    assert(testOutputTrailerInfo, dumpFileFormatterTest.trailerInfo);
});
