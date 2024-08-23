import { BaseFeedsManager, FeedSource, type Post } from "./base-feeds-manager";
import { XMLParser } from "fast-xml-parser";
import { wait } from "../../../utility/wait";
import { warn } from "../log";
import { z } from "zod";



const rssItemObject = z.object({
    title: z.string(),
    link: z.string(),
    guid: z.string(),
    pubDate: z.number()
});

const rssFeedObject = z.object({
    rss: z.object({
        channel: z.object({
            title: z.string(),
            item: z.optional(rssItemObject.array())
        })
    })
});
type RSSFeedObject = z.infer<typeof rssFeedObject>;


export type RSSFeedData = {
    source: FeedSource.RSS,
    url: string
}

export type RSSFeed = {
    name: string,
    url: string,
    lastRead?: { guid: string, timestamp: number }
}

export type RSSHost = {
    name: string,
    feeds: RSSFeed[]
}

export type RSSFeeds = {
    hosts: RSSHost[]
}


export class RSSFeedsManager implements BaseFeedsManager {
    private static TIME_BETWEEN_REQUESTS = 1000;

    getEmptyFeeds(): RSSFeeds {
        return { hosts: [] };
    }

    async addFeed(feeds: RSSFeeds, feedData: RSSFeedData): Promise<void> {
        const data = await this.request(feedData.url);
        const items = data.rss.channel.item;

        const rssFeed: RSSFeed = { url: feedData.url, name: data.rss.channel.title };
        if (items?.[0]) {
            rssFeed.lastRead = { guid: items[0].guid, timestamp: items[0].pubDate };
        }

        const hostName = new URL(feedData.url).origin;


        const hostObj = feeds.hosts.find((host) => host.name === hostName);
        if (hostObj) {
            if (hostObj.feeds.some((feed) => feed.url === feedData.url)) {
                throw new Error(`Feed '${feedData.url}' from '${hostObj.name}' already added`);
            }
            hostObj.feeds.push(rssFeed);
        }
        else {
            feeds.hosts.push({ name: hostName, feeds: [rssFeed]});
        }
    }

    removeFeed(feeds: RSSFeeds, feedData: RSSFeedData): void {
        const hostName = new URL(feedData.url).origin;
        const hostIndex = feeds.hosts.findIndex((host) => host.name === hostName);
        const hostObj = feeds.hosts[hostIndex];
        if (hostObj?.feeds.some((feed) => feed.url === feedData.url)) {
            hostObj.feeds = hostObj.feeds.filter((feed) => feed.url !== feedData.url);

            if (hostObj.feeds.length === 0) {
                feeds.hosts.splice(hostIndex, 1);
            }
        }
        else {
            throw new Error(`No feed '${feedData.url}' from '${hostName}'`);
        }
    }

    hasFeed(feeds: RSSFeeds, feedData: RSSFeedData): boolean {
        if (!URL.canParse(feedData.url)) {
            return false;
        }

        const hostName = new URL(feedData.url).origin;
        const hostObj = feeds.hosts.find((host) => host.name === hostName);
        return !!(hostObj?.feeds.some((feed) => feed.url === feedData.url));
    }

    async update(feeds: RSSFeeds): Promise<Post[]> {
        const promises: Promise<Post[]>[] = [];
        for (const host of feeds.hosts) {
            promises.push(this.handleHost(host));
        }

        return (await Promise.all(promises)).flat();
    }

    private async handleHost(host: RSSHost): Promise<Post[]> {
        const newPosts: Post[] = [];

        for (const feed of host.feeds) {
            try {
                newPosts.push(...await this.getPosts(feed));
            }
            catch (reason) {
                await warn(`Failed to get feed '${feed.name}' from '${host.name}': ${reason}.`);
            }
        }

        return newPosts;
    }

    private async getPosts(feed: RSSFeed): Promise<Post[]> {
        const newPosts: Post[] = [];
        const data = await this.request(feed.url);
        feed.name = data.rss.channel.title;
        const items = data.rss.channel.item;

        if (items?.length) {
            for (const item of items) {
                if (feed.lastRead && (feed.lastRead.guid === item.guid || item.pubDate < feed.lastRead.timestamp )) {
                    break;
                }
    
                newPosts.push({
                    id: item.guid,
                    title: item.title,
                    url: item.link,
                    source: feed.name,
                    created: item.pubDate
                });
            }
            
            if (items[0]) {
                feed.lastRead = { guid: items[0].guid, timestamp: items[0].pubDate };
            }
        }

        return newPosts;
    }

    private async request(url: string): Promise<RSSFeedObject> {
        await wait(RSSFeedsManager.TIME_BETWEEN_REQUESTS);
        
        const response = await fetch(url);
        const text = await response.text();
        if (!response.ok) {
            throw new Error(`[${response.status}] ${text}`);
        }

        const parser = new XMLParser({
            parseTagValue: false,
            isArray: (tagName) => tagName === "item",
            tagValueProcessor: (tagName, tagValue) => tagName === "pubDate" ? Date.parse(tagValue) : tagValue
        });
        const data: unknown = parser.parse(text);
        const result = rssFeedObject.safeParse(data);
        if (!result.success) {
            throw new Error(`Failed to get RSS feed: ${result.error}`);
        }

        return result.data;
    }
}
