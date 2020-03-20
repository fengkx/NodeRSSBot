/* eslint-disable */
import {config} from "../config";
const { proxy } = config;
import {HttpProxyAgent} from 'http-proxy-agent';
import {HttpsProxyAgent} from 'https-proxy-agent';
import {SocksProxyAgent} from 'socks-proxy-agent';
let agent;
if (proxy.protocol && proxy.host && proxy.port) {
    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    switch (proxy.protocol.slice(0, 5)) {
        case 'http':
            agent = new HttpProxyAgent(proxyUrl);
            break;
        case 'https':
            agent = new HttpsProxyAgent(proxyUrl);
            break;
        case 'socks':
            agent = new SocksProxyAgent(proxyUrl);
            break;
    }
}

export default agent;
