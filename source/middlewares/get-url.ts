import errors from '../utils/errors';
import { getSubscribedFeedsByUserId } from '../proxies/rss-feed';
import i18n from '../i18n';
import { MContext, Next } from '../types/ctx';

export default async (ctx: MContext, next: Next) => {
    const { lang } = ctx.state;
    const { text } = ctx.message;
    const [command, url] = text.split(/\s+/);
    if (!url) {
        switch (command.substr(0, 4)) {
            case '/sub':
                throw errors.newCtrlErr('SUB_USAGE');
            case '/uns':
                if (command.substr(0, 8) === '/unsubthis') {
                    throw errors.newCtrlErr('UNSUBTHIS_USAGE');
                } else if (ctx.state.chat.type === 'private') {
                    const feeds = await getSubscribedFeedsByUserId(
                        ctx.state.chat.id
                    );
                    await ctx.reply(i18n[lang]['CHOOSE_UNSUB'], {
                        reply_markup: {
                            // @ts-ignore
                            keyboard: feeds.map((i) => {
                                return [`[${i.feed_id}] ${i.feed_title}`];
                            }),
                            one_time_keyboard: true
                        }
                    });
                } else {
                    throw errors.newCtrlErr('UNSUB_USAGE');
                }
                return; // this ctx end wait for another message from keyboard
            case '/exp':
                throw errors.newCtrlErr('EXPORT');
            case '/all':
                throw errors.newCtrlErr('USB_ALL_USAGE');
            case '/vie':
                throw errors.newCtrlErr('VIEW_ALL_USAGE');
        }
    } else if (!url.startsWith('http') && !url.startsWith('https')) {
        throw errors.newCtrlErr('FEED_URL_NOT_PARSE');
    }
    ctx.state.feedUrl = decodeURI(url);
    await next();
};
