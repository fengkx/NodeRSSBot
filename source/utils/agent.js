/* eslint-disable */
const { proxy } = require('../config');
const HttpProxyAgent = require('http-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');
const SocksProxyAgent = require('socks-proxy-agent');
let agent = null;
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

module.exports = agent;
