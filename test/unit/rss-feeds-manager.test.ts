import { afterEach, beforeEach, expect, suite, vi } from "vitest";
import { post0, post1, post2 } from "../data/rss";
import { FeedSource } from "../../src/backend/feeds/base-feeds-manager";
import { rssTest } from "./rss-feeds-manager-fixtures";



beforeEach(() => {
    vi.useFakeTimers();
    vi.runAllTimersAsync().catch((reason: unknown) => {
        console.error(`Failed to run timers: ${reason}.`);
    });
    vi.mock("../../src/backend/log", () => ({
        warn: (message: string) => { throw new Error(message); },
        error: (message: string) => { throw new Error(message); }
    }));
});

afterEach(() => {
    vi.resetAllMocks();
});


suite("Adding feeds", () => {
    rssTest("Can add feed", async ({ manager, feeds, rss }) => {
        rss.textData.rss.channel.item.push(post1, post0);

        await manager.addFeed(feeds, { source: FeedSource.RSS, url: "https://rss.com" });

        expect(feeds.hosts).toEqual([{
            name: "https://rss.com",
            feeds: [{
                lastRead: {
                    guid: post1.guid,
                    timestamp: Date.parse(post1.pubDate)
                },
                name: rss.textData.rss.channel.title,
                url: "https://rss.com"
            }]
        }]);
    });

    rssTest("Can catch adding a duplicate feed", async ({ manager, feeds, rss }) => {
        rss.textData.rss.channel.item.push(post0);
        feeds.hosts.push({ name: "https://rss.com", feeds: [{ name: "testFeed", url: "https://rss.com/test" }] });

        const result = manager.addFeed(feeds, { source: FeedSource.RSS, url: "https://rss.com/test" });

        await expect(result).rejects.toThrow("Feed 'https://rss.com/test' from 'https://rss.com' already added");
    });
});

suite("Removing feeds", () => {
    rssTest("Can remove feed", ({ manager, feeds }) => {
        feeds.hosts.push({ name: "https://rss.com", feeds: [
            { name: "testFeed0", url: "https://rss.com/test0" },
            { name: "testFeed1", url: "https://rss.com/test1" }
        ] });

        manager.removeFeed(feeds, { source: FeedSource.RSS, url: "https://rss.com/test0" });

        expect(feeds.hosts[0]).toEqual({ name: "https://rss.com", feeds: [{ name: "testFeed1", url: "https://rss.com/test1" }] });
    });

    rssTest("Can remove host when its only feed is removed", ({ manager, feeds }) => {
        feeds.hosts.push({ name: "https://rss.com", feeds: [{ name: "testFeed", url: "https://rss.com/test" }] });

        manager.removeFeed(feeds, { source: FeedSource.RSS, url: "https://rss.com/test" });

        expect(feeds.hosts.length).toEqual(0);
    });

    rssTest("Can catch removing non-existant feed from existing host", ({ manager, feeds }) => {
        feeds.hosts.push({ name: "https://rss.com", feeds: [{ name: "testFeed0", url: "https://rss.com/test0" }] });

        expect(() => { manager.removeFeed(feeds, { source: FeedSource.RSS, url: "https://rss.com/test1" }); })
            .toThrow("No feed 'https://rss.com/test1' from 'https://rss.com'");
    });

    rssTest("Can catch removing non-existant feed from non-existant host", ({ manager, feeds }) => {
        expect(() => { manager.removeFeed(feeds, { source: FeedSource.RSS, url: "https://rss.com/test" }); })
            .toThrow("No feed 'https://rss.com/test' from 'https://rss.com'");
    });
});


suite("Checking for feed", () => {
    rssTest("Can check if feed exists", ({ manager, feeds }) => {
        feeds.hosts.push({ name: "https://rss.com", feeds: [{ name: "testFeed", url: "https://rss.com/test" }] });

        const result = manager.hasFeed(feeds, { source: FeedSource.RSS, url: "https://rss.com/test" });

        expect(result).toBeTruthy();
    });

    rssTest("Can check if feed does not exist", ({ manager, feeds }) => {
        feeds.hosts.push({ name: "https://rss.com", feeds: [{ name: "testFeed0", url: "https://rss.com/test0" }] });

        const result = manager.hasFeed(feeds, { source: FeedSource.RSS, url: "https://rss.com/test1" });

        expect(result).toBeFalsy();
    });

    rssTest("Can check if feed does not exist when host also does not exist", ({ manager, feeds }) => {
        const result = manager.hasFeed(feeds, { source: FeedSource.RSS, url: "https://rss.com/test" });

        expect(result).toBeFalsy();
    });

    rssTest("Can check invalid feed url", ({ manager, feeds }) => {
        const result = manager.hasFeed(feeds, { source: FeedSource.RSS, url: "invalidFeedUrl" });

        expect(result).toBeFalsy();
    });
});


suite("Update", () => {
    rssTest("Can get new posts when there is no last read post", async ({ manager, feeds, rss }) => {
        feeds.hosts.push({ name: "https://rss.com", feeds: [{ name: "testFeed", url: "https://rss.com/test" }] });
        rss.textData.rss.channel.item.push(post0);

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            created: Date.parse(post0.pubDate),
            id: post0.guid,
            source: rss.textData.rss.channel.title,
            title: post0.title,
            url: post0.link
        }]);
        expect(feeds.hosts[0]?.feeds[0]?.lastRead?.guid).toEqual(post0.guid);
        expect(feeds.hosts[0]?.feeds[0]?.lastRead?.timestamp).toEqual(Date.parse(post0.pubDate));
    });

    rssTest("Can get new posts when there is a last read post", async ({ manager, feeds, rss }) => {
        feeds.hosts.push({
            name: "https://rss.com",
            feeds: [{
                name: "testFeed",
                url: "https://rss.com/test",
                lastRead: { guid: post1.guid, timestamp: Date.parse(post1.pubDate) }
            }]
        });
        rss.textData.rss.channel.item.push(post2, post1, post0);

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            created: Date.parse(post2.pubDate),
            id: post2.guid,
            source: rss.textData.rss.channel.title,
            title: post2.title,
            url: post2.link
        }]);
        expect(feeds.hosts[0]?.feeds[0]?.lastRead?.guid).toEqual(post2.guid);
        expect(feeds.hosts[0]?.feeds[0]?.lastRead?.timestamp).toEqual(Date.parse(post2.pubDate));
    });

    rssTest("Can get new posts when last read post was deleted", async ({ manager, feeds, rss }) => {
        feeds.hosts.push({
            name: "https://rss.com",
            feeds: [{
                name: "testFeed",
                url: "https://rss.com/test",
                lastRead: { guid: post1.guid, timestamp: Date.parse(post1.pubDate) }
            }]
        });
        rss.textData.rss.channel.item.push(post2, post0);

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            created: Date.parse(post2.pubDate),
            id: post2.guid,
            source: rss.textData.rss.channel.title,
            title: post2.title,
            url: post2.link
        }]);
        expect(feeds.hosts[0]?.feeds[0]?.lastRead?.guid).toEqual(post2.guid);
        expect(feeds.hosts[0]?.feeds[0]?.lastRead?.timestamp).toEqual(Date.parse(post2.pubDate));
    });

    rssTest("Can catch failed request", async ({ manager, feeds, rss }) => {
        feeds.hosts.push({ name: "https://rss.com", feeds: [{ name: "testFeed", url: "https://rss.com/test" }] });
        rss.response.ok = false;
        rss.response.status = 404;
        rss.response.text = vi.fn().mockImplementation(() => "Invalid");

        const result = manager.update(feeds);

        await expect(result).rejects.toThrow("[404] Invalid");
    });

    rssTest("Can catch invalid RSS feed", async ({ manager, feeds, rss }) => {
        feeds.hosts.push({ name: "https://rss.com", feeds: [{ name: "testFeed", url: "https://rss.com/test" }] });
        rss.textData.rss.channel.item.push({ invalid: true });

        const result = manager.update(feeds);

        await expect(result).rejects.toThrow("Failed to get RSS feed: ");
    });
});
