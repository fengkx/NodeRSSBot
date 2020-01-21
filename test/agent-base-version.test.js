const lockJson = require('../package-lock.json');

test('agent-base version greater than 5', () => {
    expect(
        lockJson.dependencies['socks-proxy-agent'].dependencies
    ).toHaveProperty('agent-base');
    // eslint-disable-next-line no-unused-vars
    const [major, minor, patch] = lockJson.dependencies[
        'socks-proxy-agent'
    ].dependencies['agent-base'].version
        .split('.')
        .map(parseInt);
    expect(major).toBeGreaterThanOrEqual(5);
});
