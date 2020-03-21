import { dependencies } from '../package-lock.json';

test('agent-base version greater than 5', () => {
    expect(dependencies['socks-proxy-agent'].dependencies).toHaveProperty(
        'agent-base'
    );
    // eslint-disable-next-line no-unused-vars
    const [major] = dependencies['socks-proxy-agent'].dependencies[
        'agent-base'
    ].version
        .split('.')
        .map(parseInt);
    expect(major).toBeGreaterThanOrEqual(5);
});
