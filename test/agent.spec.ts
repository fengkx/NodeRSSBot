import { Config } from '../source/types/config';

describe('no proxy is set', () => {
    const allNullProxy: Partial<Config> = {
        proxy: {
            protocol: null,
            host: null,
            port: null
        }
    };
    beforeAll(() => {
        jest.mock('../source/config', (): { config: Partial<Config> } => ({
            config: allNullProxy
        }));
    });
    test('actually mocked', async () => {
        const { config } = await import('../source/config');
        expect(config).toEqual(allNullProxy);
    });
    test('agent should have keepAlive', async () => {
        const agentModule = await import('../source/utils/agent');
        const agent = agentModule.default;
        expect(agent.http).toHaveProperty('keepAlive', true);
        expect(agent.https).toHaveProperty('keepAlive', true);
    });

    afterAll(() => {
        jest.resetModules();
    });
});

describe('http proxy is set', () => {
    const httpProxyCofig: Partial<Config> = {
        proxy: {
            protocol: 'http',
            host: '10.0.2.2',
            port: '1080'
        }
    };
    beforeAll(() => {
        jest.mock('../source/config', (): { config: Partial<Config> } => ({
            config: httpProxyCofig
        }));
    });
    test('actually mocked', async () => {
        const { config } = await import('../source/config');
        expect(config).toEqual(httpProxyCofig);
    });
    test('agent should contain http and https', async () => {
        const agentModule = await import('../source/utils/agent');
        const agent = agentModule.default;
        expect(agent.http).toHaveProperty(
            'proxyOptions.host',
            httpProxyCofig.proxy.host
        );
        expect(agent.http).toHaveProperty(
            'proxyOptions.port',
            parseInt(httpProxyCofig.proxy.port)
        );
        expect(agent.http).toHaveProperty('keepAlive', true);
        expect(agent.https).toHaveProperty('keepAlive', true);
    });

    afterAll(() => {
        jest.resetModules();
    });
});

describe('https proxy is set', () => {
    const httpsProxyCofig: Partial<Config> = {
        proxy: {
            protocol: 'https',
            host: '10.0.2.2',
            port: '1080'
        }
    };
    beforeAll(() => {
        jest.mock('../source/config', (): { config: Partial<Config> } => ({
            config: httpsProxyCofig
        }));
    });
    test('actually mocked', async () => {
        const { config } = await import('../source/config');
        expect(config).toEqual(httpsProxyCofig);
    });
    test('agent should contain http and https', async () => {
        const agentModule = await import('../source/utils/agent');
        const agent = agentModule.default;
        expect(agent.http).toHaveProperty(
            'proxyOptions.host',
            httpsProxyCofig.proxy.host
        );
        expect(agent.http).toHaveProperty(
            'proxyOptions.port',
            parseInt(httpsProxyCofig.proxy.port)
        );
        expect(agent.http).toHaveProperty('keepAlive', true);
        expect(agent.https).toHaveProperty('keepAlive', true);
    });

    afterAll(() => {
        jest.resetModules();
    });
});

describe('socks proxy is set', () => {
    const httpsProxyCofig: Partial<Config> = {
        proxy: {
            protocol: 'socks',
            host: '10.0.2.2',
            port: '1080'
        }
    };
    beforeAll(() => {
        jest.mock('../source/config', (): { config: Partial<Config> } => ({
            config: httpsProxyCofig
        }));
    });
    test('actually mocked', async () => {
        const { config } = await import('../source/config');
        expect(config).toEqual(httpsProxyCofig);
    });
    test('agent should contain http and https', async () => {
        const agentModule = await import('../source/utils/agent');
        const agent = agentModule.default;
        expect(agent.http).toHaveProperty(
            'proxy.host',
            httpsProxyCofig.proxy.host
        );
        expect(agent.http).toHaveProperty(
            'proxy.port',
            parseInt(httpsProxyCofig.proxy.port)
        );
        expect(agent.http).toHaveProperty('keepAlive', true);
        expect(agent.https).toHaveProperty('keepAlive', true);
    });

    afterAll(() => {
        jest.resetModules();
    });
});
