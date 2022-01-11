import { config } from '../config';
const { proxy } = config;

export const proxyUrl =
    proxy.protocol && proxy.host && proxy.port
        ? `${proxy.protocol}://${proxy.host}:${proxy.port}`
        : null;
