import got from 'got-iconv';
import { Got } from 'got-iconv';
import { config } from '../config';
import agent from './agent';

const AcceptHeader =
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8 ';

const custom = ((got as unknown) as Got).extend({
    headers: {
        'user-agent': config.UA,
        accept: AcceptHeader
    },
    timeout: {
        response: config.resp_timeout * 1000
    },
    agent: agent
    // http2: true
});

export default custom;
