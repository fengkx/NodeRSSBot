const errors = require('../utils/errors');

const TEST_CODE = 'TEST_CODE';

jest.mock('../utils/logger', () => ({
    error: jest.fn()
}));

test('newCtrlErr', async () => {
    const err = errors.newCtrlErr(TEST_CODE);
    expect(err).toHaveProperty('code', TEST_CODE);
    expect(err).toBeInstanceOf(errors.ControllableError);
    expect(require('../utils/logger').error).not.toHaveBeenCalled();
});

test('newCtrlErr with exist error', async () => {
    const e = new Error('TEST');
    const err = errors.newCtrlErr(TEST_CODE, e);

    expect(err).toHaveProperty('code', TEST_CODE);
    expect(err).toBeInstanceOf(errors.ControllableError);
    expect(require('../utils/logger').error).toHaveBeenCalled();
});
