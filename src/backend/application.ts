import * as Storage from "./storage";
import { BaseFeedsManager, type FeedData, FeedSource, type Feeds, type Post } from "./feeds/base-feeds-manager";
import { Err, Ok, type Result } from "../../utility/result";
import { type Settings, defaultSettings } from "./settings";
import { error, getLog, info, warn } from "./log";
import { KemonoFeedsManager } from "./feeds/kemono-feeds-manager";
import type { Message } from "./message";
import { RSSFeedsManager } from "./feeds/rss-feeds-manager";
import { RedditFeedsManager } from "./feeds/reddit-feeds-manager";
import { createAlarm } from "./alarm";
import { formatDistanceToNowStrict } from "date-fns";



const feedsManagers: { [Key in FeedSource]: BaseFeedsManager } = {
    [FeedSource.Reddit]: new RedditFeedsManager(),
    [FeedSource.RSS]: new RSSFeedsManager(),
    [FeedSource.Kemono]: new KemonoFeedsManager()
};


export function getSettings(): Promise<Settings> {
    return Storage.get(Storage.GenericKey.Settings, defaultSettings);
}

export async function setSettings(newSettings: Settings) {
    const currentSettings = await getSettings();

    if (currentSettings.updatePeriod !== newSettings.updatePeriod) {
        await createAlarm(newSettings.updatePeriod);
    }
    
    await Storage.set(Storage.GenericKey.Settings, newSettings);
}

export function getFeeds(feedSource: FeedSource): Promise<Feeds> {
    return Storage.get(feedSource, feedsManagers[feedSource].getEmptyFeeds());
}

export async function addFeed(feedData: FeedData): Promise<Result<boolean>> {
    try {
        const feeds = await Storage.get(feedData.source, feedsManagers[feedData.source].getEmptyFeeds());
        await feedsManagers[feedData.source].addFeed(feeds, feedData);
        await Storage.set(feedData.source, feeds);
        return Ok(true);
    }
    catch (reason) {
        const message = `Failed to add feed: ${reason}.`;
        await warn(message);
        return Err(message);
    }
}

export async function removeFeed(feedData: FeedData): Promise<Result<boolean>> {
    try {
        const feeds = await Storage.get(feedData.source, feedsManagers[feedData.source].getEmptyFeeds());
        feedsManagers[feedData.source].removeFeed(feeds, feedData);
        await Storage.set(feedData.source, feeds);
        return Ok(true);
    }
    catch (reason) {
        const message = `Failed to remove feed: ${reason}.`;
        await warn(message);
        return Err(message);
    }
}

export async function hasFeed(feedData: FeedData): Promise<boolean> {
    const feeds = await Storage.get(feedData.source, feedsManagers[feedData.source].getEmptyFeeds());
    return feedsManagers[feedData.source].hasFeed(feeds, feedData);
}

export function getUnreadPosts(): Promise<Post[]> {
    return Storage.get(Storage.GenericKey.UnreadPosts, []);
}

export async function readPosts(open: boolean, id?: string) {
    const unreadPosts = await Storage.get(Storage.GenericKey.UnreadPosts, []);
    const posts = BaseFeedsManager.readPosts(unreadPosts, id);
    
    for (const post of posts) {
        if (open) {
            await chrome.tabs.create({ url: post.url, active: false });
        }
        chrome.notifications.clear(post.id);
    }
    await chrome.action.setBadgeText({ text: unreadPosts.length ? `${unreadPosts.length}` : "" });

    await Storage.set(Storage.GenericKey.UnreadPosts, unreadPosts);
}

export async function update() {
    const newPosts: Post[] = [];
    const unreadPosts = await Storage.get(Storage.GenericKey.UnreadPosts, []);

    for (const source of Object.values(FeedSource)) {
        try {
            await info(`Updating feed '${source}'.`);

            const feeds = await Storage.get(source, feedsManagers[source].getEmptyFeeds());
            const newFeedPosts = await feedsManagers[source].update(feeds);

            newPosts.push(...newFeedPosts);
            unreadPosts.push(...newFeedPosts);

            await Storage.set(Storage.GenericKey.UnreadPosts, unreadPosts);
            await Storage.set(source, feeds);
        }
        catch (reason) {
            await error(`Failed to update feed '${source}': ${reason}.`);
        }
    }

    await chrome.action.setBadgeText({ text: unreadPosts.length ? `${unreadPosts.length}` : "" });

    for (const post of newPosts) {
        chrome.notifications.create(post.id,
            {
                message: `${post.source}\n${formatDistanceToNowStrict(post.created, { addSuffix: true })}`,
                iconUrl: "/icons/icon-128.png",
                title: post.title,
                type: "basic",
                buttons: [{ title: "Mark As Read" }]
            }
        );
    }
}

export async function importFeeds(combinedFeedsObject: { [Key in FeedSource]: Feeds }): Promise<void> {
    for (const source of Object.values(FeedSource)) {
        await Storage.set(source, combinedFeedsObject[source]);
    }
}

export async function handleMessage(message: Message, sendResponse: (response?: unknown) => void) {
    try {
        switch (message.type) {
            case "GetSettings": {
                const settings = await getSettings();
                sendResponse(settings);
                break;
            }
            case "SetSettings": {
                await setSettings(message.newSettings);
                sendResponse();
                break;
            }
            case "GetFeeds": {
                const feeds = await getFeeds(message.source);
                sendResponse(feeds);
                break;
            }
            case "AddFeed": {
                const result = await addFeed(message.feedData);
                sendResponse(result);
                break;
            }
            case "RemoveFeed": {
                const result = await removeFeed(message.feedData);
                sendResponse(result);
                break;
            }
            case "HasFeed": {
                const result = await hasFeed(message.feedData);
                sendResponse(result);
                break;
            }
            case "GetUnreadPosts": {
                const unreadPosts = await getUnreadPosts();
                sendResponse(unreadPosts);
                break;
            }
            case "ReadPosts": {
                await readPosts(message.open, message.id);
                sendResponse();
                break;
            }
            case "Update": {
                await update();
                sendResponse();
                break;
            }
            case "ImportFeeds": {
                await importFeeds(message.combinedFeedsObject);
                sendResponse();
                break;
            }
            case "GetLog": {
                const log = await getLog();
                sendResponse(log);
                break;
            }
            default: {
                const unreachable: never = message;
                await error(`Invalid message '${JSON.stringify(unreachable)}'.`);
                break;
            }
        }
    }
    catch (reason: unknown) {
        await error(`Failed to '${message.type}': ${reason}.`);
    }
}
