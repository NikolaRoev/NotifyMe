import { BaseFeedsManager, FeedSource, type Post } from "./base-feeds-manager";
import { wait } from "../../utility/wait";



type RSSItem = {
    title: string,
    url: string,
    guid: string,
    timestamp: number
}

export type RSSFeedData = {
    source: FeedSource.RSS,
    url: string
}

export type RSSFeed = {
    name: string,
    url: string,
    lastRead?: { guid: string, timestamp: number }
}

export type RSSFeeds = {
    feeds: RSSFeed[]
}


export class RSSFeedsManager implements BaseFeedsManager {
    private static TIME_BETWEEN_REQUESTS = 1000;

    getEmptyFeeds(): RSSFeeds {
        return { feeds: [] };
    }

    async addFeed(feeds: RSSFeeds, feedData: RSSFeedData): Promise<void> {
        if (feeds.feeds.some((value) => value.url === feedData.url)) {
            throw new Error(`Feed '${feedData.url}' already added`);
        }

        const data = await this.request(feedData.url);
        const name = this.extractName(data);
        const items = this.extractItems(data);

        const rssFeed: RSSFeed = { url: feedData.url, name: name };
        if (items[0]) {
            rssFeed.lastRead = { guid: items[0].guid, timestamp: items[0].timestamp };
        }
        feeds.feeds.push(rssFeed);
    }

    removeFeed(feeds: RSSFeeds, feedData: RSSFeedData): void {
        const feedIndex = feeds.feeds.findIndex((value) => value.url === feedData.url);
        
        if (feedIndex === -1) {
            throw new Error(`No feed '${feedData.url}'`);
        }

        feeds.feeds.splice(feedIndex, 1);
    }

    hasFeed(feeds: RSSFeeds, feedData: RSSFeedData): boolean {
        return feeds.feeds.some((value) => value.url === feedData.url);
    }

    async update(feeds: RSSFeeds): Promise<Post[]> {
        const newPosts: Post[] = [];

        for (const feed of feeds.feeds) {
            newPosts.push(...await this.getPosts(feed));
        }

        return newPosts;
    }

    private async getPosts(feed: RSSFeed): Promise<Post[]> {
        const newPosts: Post[] = [];
        const data = await this.request(feed.url);
        feed.name = this.extractName(data);
        const items = this.extractItems(data);

        for (const item of items) {
            if (feed.lastRead && (feed.lastRead.guid === item.guid || item.timestamp < feed.lastRead.timestamp )) {
                break;
            }

            newPosts.push({
                id: item.guid,
                title: item.title,
                url: item.url,
                source: feed.name,
                created: item.timestamp
            });
        }
        
        if (items[0]) {
            feed.lastRead = { guid: items[0].guid, timestamp: items[0].timestamp };
        }
        return newPosts;
    }

    private extractName(data: string): string {
        const sourceMatch = data.match(/<title>(?<name>.+?)<\/title>/);
        if (sourceMatch?.groups?.name === undefined) {
            throw new Error(`Invalid title match '${JSON.stringify(sourceMatch)}'`);
        }

        return sourceMatch.groups.name;
    }

    private extractItems(data: string): RSSItem[] {
        const items: RSSItem[] = [];

        const regex = new RegExp(
            "<item>.*?" +
            "<title>(?<title>.+?)<\\/title>.*?" +
            "<link>(?<url>.+?)<\\/link>.*?" +
            "<guid isPermaLink=\".*?\">(?<guid>.+?)<\\/guid>.*?" +
            "<pubDate>(?<timestamp>.+?)<\\/pubDate>.*?" +
            "<\\/item>", "gs"
        );
        const matches = Array.from(data.matchAll(regex));
        for (const match of matches) {
            if (!match.groups?.title || !match.groups.url || !match.groups.guid || !match.groups.timestamp) {
                throw new Error(`Invalid post match '${JSON.stringify(match)}'`);
            }

            const item: RSSItem = {
                title: match.groups.title,
                url: match.groups.url,
                guid: match.groups.guid,
                timestamp: Date.parse(match.groups.timestamp)
            };
            items.push(item);
        }

        return items;
    }

    private async request(url: string): Promise<string> {
        await wait(RSSFeedsManager.TIME_BETWEEN_REQUESTS);
        
        const response = await fetch(url);
        const data = await response.text();
        if (!response.ok) {
            throw new Error(`[${response.status}] ${data}`);
        }

        if (!/<rss .*?version="2\.0".*?>.*<\/rss>/gs.test(data)) {
            throw new Error("Invalid RSS feed");
        }

        return data;
    }
}
