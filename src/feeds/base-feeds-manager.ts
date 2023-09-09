import type { RSSFeedData, RSSFeeds } from "./rss-feeds-manager";
import type { RedditFeedData, RedditFeeds } from "./reddit-feeds-manager";



export enum FeedSource {
    Reddit = "Reddit",
    RSS = "RSS"
}

export type Post = {
    id: string,
    title: string,
    url: string,
    source: string,
    created: number,
}

export type FeedData =
    RedditFeedData |
    RSSFeedData

export type Feeds =
    RedditFeeds |
    RSSFeeds


export abstract class BaseFeedsManager {
    /**
     * Will be empty but will have the correct structure. Used to initialize the feeds storage.
     * 
     * @returns The specific feeds object. Different on each FeedsManager.
     */
    abstract getEmptyFeeds(): Feeds;

    /**
     * Will first verify if the feed exists using a request.
     * Modifies `feeds`.
     * 
     * @param feeds The specific feeds object. Different on each FeedsManager.
     * @param feedData The feed data to add.
     */
    abstract addFeed(feeds: Feeds, feedData: FeedData): Promise<void>;

    /**
     * Modifies `feeds`.
     * 
     * @param feeds The specific feeds object. Different on each FeedsManager.
     * @param feedData The feed data to remove.
     */
    abstract removeFeed(feeds: Feeds, feedData: FeedData): void;

    /**
     * @param feeds The specific feeds object. Different on each FeedsManager.
     * @param feedData The feed data to check.
     */
    abstract hasFeed(feeds: Feeds, feedData: FeedData): boolean;

    /**
     * Modifies `feeds`.
     * 
     * @param feeds The specific feeds object. Different on each FeedsManager.
     * @returns The new posts.
     */
    abstract update(feeds: Feeds): Promise<Post[]>;

    /**
     * Modifies `unreadPosts`. If `id` is set remove that post and return it.
     * Otherwise extract all posts and return them.
     * 
     * @param unreadPosts The stored unread posts.
     * @param id Optional post id.
     * @returns The posts to be read.
     */
    static readPosts(unreadPosts: Post[], id?: string): Post[] {
        if (id) {
            const postIndex = unreadPosts.findIndex((value) => value.id === id);

            if (postIndex === -1) {
                throw new Error(`Missing post '${id}'`);
            }

            return unreadPosts.splice(postIndex, 1);
        }
        else {
            return unreadPosts.splice(0, unreadPosts.length);
        }
    }
}
