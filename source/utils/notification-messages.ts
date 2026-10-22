/**
 * Notification message templates for RSS feed errors and changes.
 * All user-controlled data (titles, URLs, error messages) is passed as EJS locals
 * and rendered with escaped output (<%= %>) to prevent injection of Telegram HTML.
 */

import { Feed } from '../types/feed';
import { Messenger } from '../types/message';

export interface ErrorNotificationData {
    title: string;
    url: string;
    errorMessage: string;
}

export interface FeedChangeNotificationData {
    title: string;
    url: string;
    newFeedUrls: string[];
}

/**
 * Build error notification message template and locals.
 * Used when a feed fails to fetch multiple times (ERROR_MANY_TIME).
 */
export function buildErrorNotification(
    feed: Feed,
    error: Messenger
): [string, ErrorNotificationData] {
    const template =
        '<%= title %>: <a href="<%= url %>"><%= url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%= errorMessage %>';

    const locals: ErrorNotificationData = {
        title: feed.feed_title,
        url: feed.url,
        errorMessage: error.message
    };

    return [template, locals];
}

/**
 * Build feed URL change notification message template and locals.
 * Used when RSS feed URL changes are detected (isChangeFeedUrl).
 */
export function buildFeedChangeNotification(
    feed: Feed,
    newFeedUrls: string[],
    urlEncoder: (url: string) => string
): [string, FeedChangeNotificationData] {
    const template =
        '<%= title %>: <a href="<%= url %>"></a> <%=i18n["ERROR_MANY_TIME"]%>\n' +
        '<b><%=i18n["FOUND_FEEDS"]%></b>:\n' +
        '<% newFeedUrls.forEach(function(feed_url) { %><%= feed_url %>\n<% }); %>' +
        '<%=i18n["FEED_CHANGE_TO"]%> <%= newFeedUrls[0] %>';

    const locals: FeedChangeNotificationData = {
        title: feed.feed_title,
        url: urlEncoder(feed.url),
        newFeedUrls: newFeedUrls
    };

    return [template, locals];
}
