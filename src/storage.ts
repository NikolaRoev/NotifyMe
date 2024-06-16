import { FeedSource, type Post } from "./feeds/base-feeds-manager";
import type { LogMessage } from "./log";
import type { RSSFeeds } from "./feeds/rss-feeds-manager";
import type { RedditFeeds } from "./feeds/reddit-feeds-manager";
import type { Settings } from "./settings";



export enum GenericKey {
    Log = "LOG-KEY",
    Settings = "SETTINGS-KEY",
    UnreadPosts = "UNREAD-POSTS-KEY",
}

type Keys = GenericKey | FeedSource;

type Type<T> =
    T extends GenericKey.Log ? LogMessage[] :
    T extends GenericKey.Settings ? Settings :
    T extends GenericKey.UnreadPosts ? Post[] :
    T extends FeedSource.Reddit ? RedditFeeds :
    T extends FeedSource.RSS ? RSSFeeds :
    never;


export async function get<T extends Keys>(key: T, defaultValue: Type<T>): Promise<Type<T>> {
    const obj = await chrome.storage.local.get({ [key]: defaultValue });
    return obj[key] as Promise<Type<T>>;
}

export async function set<T extends Keys>(key: T, value: Type<T>) {
    await chrome.storage.local.set({ [key]: value });
}
