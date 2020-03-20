const errors = require('../source/utils/errors');

const TEST_CODE = 'TEST_CODE';

jest.mock('../source/utils/logger', () => ({
    error: jest.fn()
}));

test('newCtrlErr', async () => {
    const err = errors.newCtrlErr(TEST_CODE);
    expect(err).toHaveProperty('code', TEST_CODE);
    expect(err).toBeInstanceOf(errors.ControllableError);
    expect(require('../source/utils/logger').error).not.toHaveBeenCalled();
});

test('newCtrlErr with exist error', async () => {
    const e = new Error('TEST');
    const err = errors.newCtrlErr(TEST_CODE, e);

    expect(err).toHaveProperty('code', TEST_CODE);
    expect(err).toBeInstanceOf(errors.ControllableError);
    expect(require('../source/utils/logger').error).toHaveBeenCalled();
});
