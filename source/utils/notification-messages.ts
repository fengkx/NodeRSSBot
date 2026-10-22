/**
 * Notification message templates for RSS feed errors and changes.
 *
 * All feed-controlled data (titles, URLs, error messages) is passed as EJS locals
 * and rendered with escaped output (<%= %>) to prevent injection of Telegram HTML.
 * This applies only to error and feed-change notifications; normal feed items are
 * handled elsewhere.
 */

import { Feed } from '../types/feed';
import { Messenger } from '../types/message';

/**
 * Template locals for error notifications (ERROR_MANY_TIME).
 */
export interface ErrorNotificationData {
    title: string;
    url: string;
    errorMessage: string;
}

/**
 * Template locals for feed URL change notifications (isChangeFeedUrl).
 */
export interface FeedChangeNotificationData {
    title: string;
    url: string;
    newFeedUrls: string[];
}

/**
 * Template for error notification messages.
 * Shows feed title, URL link, i18n error text, and error message.
 */
const ERROR_NOTIFICATION_TEMPLATE =
    '<%= title %>: ' +
    '<a href="<%= url %>"><%= url %></a> ' +
    '<%=i18n["ERROR_MANY_TIME"]%> ' +
    '<%= errorMessage %>';

/**
 * Template for feed URL change notifications.
 * Shows old feed info, lists discovered feeds, and indicates the new URL.
 */
const FEED_CHANGE_NOTIFICATION_TEMPLATE =
    '<%= title %>: <a href="<%= url %>"></a> <%=i18n["ERROR_MANY_TIME"]%>\n' +
    '<b><%=i18n["FOUND_FEEDS"]%></b>:\n' +
    '<% newFeedUrls.forEach(function(feedUrl) { %><%= feedUrl %>\n<% }); %>' +
    '<%=i18n["FEED_CHANGE_TO"]%> <%= newFeedUrls[0] %>';

/**
 * Build error notification message template and locals.
 *
 * @param feed - The feed that failed to fetch
 * @param error - The error that occurred
 * @returns Tuple of [template string, locals object]
 */
export function buildErrorNotification(
    feed: Feed,
    error: Messenger
): [string, ErrorNotificationData] {
    return [
        ERROR_NOTIFICATION_TEMPLATE,
        {
            title: feed.feed_title,
            url: feed.url,
            errorMessage: error.message
        }
    ];
}

/**
 * Build feed URL change notification message template and locals.
 *
 * @param feed - The feed whose URL changed
 * @param newFeedUrls - Array of discovered feed URLs
 * @param urlEncoder - Function to encode URLs (typically encodeUrl)
 * @returns Tuple of [template string, locals object]
 */
export function buildFeedChangeNotification(
    feed: Feed,
    newFeedUrls: string[],
    urlEncoder: (url: string) => string
): [string, FeedChangeNotificationData] {
    return [
        FEED_CHANGE_NOTIFICATION_TEMPLATE,
        {
            title: feed.feed_title,
            url: urlEncoder(feed.url),
            newFeedUrls
        }
    ];
}
