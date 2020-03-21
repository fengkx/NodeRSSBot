import { config } from '../config';
const { proxy } = config;
import {
    httpOverHttp,
    httpOverHttps,
    httpsOverHttp,
    httpsOverHttps
} from 'tunnel';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
type Agent = {
    http: HttpAgent;
    https: HttpsAgent;
};
let agent: Agent | undefined = undefined;
if (proxy.protocol && proxy.host && proxy.port) {
    const port = parseInt(proxy.port);
    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    switch (proxy.protocol.slice(0, 5)) {
        case 'http':
            agent = {
                http: httpOverHttp({
                    proxy: {
                        host: proxy.host,
                        port
                    }
                }),
                https: httpsOverHttp({
                    proxy: {
                        host: proxy.host,
                        port
                    }
                }) as HttpsAgent
            };
            break;
        case 'https':
            agent = {
                http: httpOverHttps({
                    proxy: {
                        host: proxy.host,
                        port
                    }
                }),
                https: httpsOverHttps({
                    proxy: {
                        host: proxy.host,
                        port
                    }
                }) as HttpsAgent
            };
            break;
        case 'socks':
            agent = {
                http: new SocksProxyAgent(proxyUrl),
                https: (new SocksProxyAgent(
                    proxyUrl
                ) as HttpAgent) as HttpsAgent
            };
            break;
    }
}

export default agent;
