import { dependencies } from '../package-lock.json';

test('agent-base version greater than 5', () => {
    expect(dependencies).toHaveProperty(
        'socks-proxy-agent.requires.agent-base'
    );
    // eslint-disable-next-line no-unused-vars
    const [major] = dependencies['socks-proxy-agent'].requires['agent-base']
        .split('.')
        .map(parseInt);
    expect(major).toBeGreaterThanOrEqual(5);
});
