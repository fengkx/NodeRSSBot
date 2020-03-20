const i18n = require('../source/i18n');

test('i18n', () => {
    expect(i18n).toHaveProperty('zh-cn');
    expect(i18n).toHaveProperty('en');
});
