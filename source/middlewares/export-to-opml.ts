import { getSubscribedFeedsByUserId } from '../proxies/rss-feed';
import errors from '../utils/errors';
import * as path from 'path';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { MContext, TNextFn } from '../types/ctx';
import { Feed } from '../types/feed';
import { config } from '../config';
import { htmlEscape } from '@cjsa/escape-goat';

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

const opmlTemplatePath = path.join(__dirname, '../template/opml.ejs');
const templateCacheMap = new Map<string, ReturnType<typeof ejs.compile>>();
const render = async (feeds: Feed[]): Promise<string> => {
    if (!templateCacheMap.has(opmlTemplatePath)) {
        const tpl = await readFilePromise(opmlTemplatePath);
        templateCacheMap.set(opmlTemplatePath, ejs.compile(tpl));
    }
    const template = templateCacheMap.get(opmlTemplatePath);

    feeds.forEach((feed) => {
        feed.feed_title = htmlEscape(feed.feed_title);
        feed.url = htmlEscape(feed.url);
    });
    return template({ feeds });
};

function remove(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.unlink(path, function (err) {
            if (err) reject(err);
            resolve();
        });
    });
}

export default async (ctx: MContext, next: TNextFn): Promise<void> => {
    const chat = ctx.state.chat;
    const feeds = await getSubscribedFeedsByUserId(chat.id);
    if (feeds.length === 0) {
        throw errors.newCtrlErr('NOT_SUB');
    }
    try {
        const opml = await render(feeds);
        const filePath = path.join(
            config['PKG_ROOT'],
            'data',
            `${chat.id.toString()}.opml`
        );
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
