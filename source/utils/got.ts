import got from 'got';
import {config} from "../config";
import charset from 'charset';
import * as charDet from 'jschardet';
import {decode} from 'iconv-lite';
import {Response} from "got/dist/source/types";
import agent from './agent';

const AcceptHeader =
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8 ';

const custom = got.extend({
    headers: {
        'user-agent': config.UA,
        accept: AcceptHeader
    },
    timeout: {
        response: config.resp_timeout * 1000
    },
    agent: agent
});

export default custom.extend({
    hooks: {
        afterResponse: [
            async (res: Response) => {
                let fromHeader = false;
                let enc = charset(res.headers['content-type']);
                if (enc) {
                    fromHeader = true;
                } else {
                    enc = charDet.detect((res.body as Buffer)).encoding;
                }
                if (enc !== 'utf8') {
                    (res.body as Buffer) = await custom(res.url).buffer();
                    if (!fromHeader) {
                        enc = charDet.detect((res.body as Buffer)).encoding || 'utf8';
                        enc = enc.toLowerCase();
                    }
                    res.body = decode((res.body as Buffer) , enc);
                }

                return res;
            }
        ]
    }
});
