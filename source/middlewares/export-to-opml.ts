import { getSubscribedFeedsByUserId } from '../proxies/rss-feed';
import errors from '../utils/errors';
import * as path from 'path';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { config } from '../config';
import { MContext, Next } from '../types/ctx';
import { Feed } from '../types/feed';

function readFilePromise(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(
            path,
            {
                encoding: 'utf8'
            },
            function (err, data) {
                if (err) reject(err);
                resolve(data);
            }
        );
    });
}

const render = async (feeds: Feed[]): Promise<string> => {
    const tpl = await readFilePromise(
        path.join(__dirname, '../template/opml.ejs')
    );
    // console.log(tpl)
    return ejs.render(tpl, { feeds });
};

function remove(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.unlink(path, function (err) {
            if (err) reject(err);
            resolve();
        });
    });
}

export default async (ctx: MContext, next: Next) => {
    const chat = ctx.state.chat;
    const feeds = await getSubscribedFeedsByUserId(chat.id);
    if (feeds.length === 0) {
        throw errors.newCtrlErr('NOT_SUB');
    }
    const opml = await render(feeds);
    try {
        const filePath = path.join(config.db_path, '..', chat.id.toString());
        fs.writeFileSync(filePath, opml);
        await ctx.replyWithDocument({
            source: fs.readFileSync(filePath),
            filename: 'export.opml'
        });
        await remove(filePath);
    } catch (e) {
        throw errors.newCtrlErr('FILESYSTEM_ERROR', e);
    }
    await next();
};
