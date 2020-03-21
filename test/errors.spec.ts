import { ControllableError, newCtrlErr } from '../source/utils/errors';
import { mocked } from 'ts-jest/utils';

jest.mock('../source/utils/logger');
import logger from '../source/utils/logger';
const mockedLogger = mocked(logger, true);

const TEST_CODE = 'TEST_CODE';
test('newCtrlErr', async () => {
    const err = newCtrlErr(TEST_CODE);
    expect(err).toHaveProperty('code', TEST_CODE);
    expect(err).toBeInstanceOf(ControllableError);
    expect(mockedLogger.error.mock.calls).toHaveLength(0);
});

test('newCtrlErr with exist error', async () => {
    const e = new Error('TEST');
    const err = newCtrlErr(TEST_CODE, e);

    expect(err).toHaveProperty('code', TEST_CODE);
    expect(err).toBeInstanceOf(ControllableError);
    expect(mockedLogger.error.mock.calls.length).toBeGreaterThanOrEqual(1);
});
