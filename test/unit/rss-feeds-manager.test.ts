import { afterEach, beforeEach, expect, suite, vi } from "vitest";
import { post0, post1, post2 } from "../data/rss";
import { FeedSource } from "../../src/feeds/base-feeds-manager";
import { rssTest } from "./rss-feeds-manager-fixtures";



beforeEach(() => {
    vi.useFakeTimers();
    vi.runAllTimersAsync().catch((reason) => { console.error(`Failed to run timers: ${reason}.`); });
});

afterEach(() => {
    vi.resetAllMocks();
});


suite("Adding feeds", () => {
    rssTest("Can add feed", async ({ manager, feeds, rss }) => {
        rss.textData.rss.channel.item.push(post1, post0);

        await manager.addFeed(feeds, { source: FeedSource.RSS, url: "testFeed" });

        expect(feeds.feeds).toEqual([{
            lastRead: {
                guid: post1.guid._,
                timestamp: Date.parse(post1.pubDate)
            },
            name: rss.textData.rss.channel.title,
            url: "testFeed"
        }]);
    });

    rssTest("Can catch adding a duplicate feed", async ({ manager, feeds, rss }) => {
        rss.textData.rss.channel.item.push(post0);
        feeds.feeds.push({ name: "testFeed", url: "testFeed" });

        const result = manager.addFeed(feeds, { source: FeedSource.RSS, url: "testFeed" });

        await expect(result).rejects.toThrow("Feed 'testFeed' already added");
    });
});

suite("Removing feeds", () => {
    rssTest("Can remove feed", ({ manager, feeds }) => {
        feeds.feeds.push({ name: "testFeed", url: "testFeed" });

        manager.removeFeed(feeds, { source: FeedSource.RSS, url: "testFeed" });

        expect(feeds.feeds.length).toEqual(0);
    });

    rssTest("Can catch removing non-existant feed", ({ manager, feeds }) => {
        expect(() => { manager.removeFeed(feeds, { source: FeedSource.RSS, url: "testFeed" }); })
            .toThrow("No feed 'testFeed'");
    });
});


suite("Checking for feed", () => {
    rssTest("Can check if feed exists", ({ manager, feeds }) => {
        feeds.feeds.push({ name: "testFeed", url: "testFeed" });

        const result = manager.hasFeed(feeds, { source: FeedSource.RSS, url: "testFeed" });

        expect(result).toBeTruthy();
    });

    rssTest("Can check if feed does not exist", ({ manager, feeds }) => {
        const result = manager.hasFeed(feeds, { source: FeedSource.RSS, url: "testFeed" });

        expect(result).toBeFalsy();
    });
});


suite("Update", () => {
    rssTest("Can get new posts when there is no last read post", async ({ manager, feeds, rss }) => {
        feeds.feeds.push({ name: "testFeed", url: "testFeed" });
        rss.textData.rss.channel.item.push(post0);

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            created: Date.parse(post0.pubDate),
            id: post0.guid._,
            source: rss.textData.rss.channel.title,
            title: post0.title,
            url: post0.link
        }]);
        expect(feeds.feeds[0]?.lastRead?.guid).toEqual(post0.guid._);
        expect(feeds.feeds[0]?.lastRead?.timestamp).toEqual(Date.parse(post0.pubDate));
    });

    rssTest("Can get new posts when there is a last read post", async ({ manager, feeds, rss }) => {
        feeds.feeds.push({
            name: "testFeed",
            url: "testFeed",
            lastRead: { guid: post1.guid._, timestamp: Date.parse(post1.pubDate) }
        });
        rss.textData.rss.channel.item.push(post2, post1, post0);

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            created: Date.parse(post2.pubDate),
            id: post2.guid._,
            source: rss.textData.rss.channel.title,
            title: post2.title,
            url: post2.link
        }]);
        expect(feeds.feeds[0]?.lastRead?.guid).toEqual(post2.guid._);
        expect(feeds.feeds[0]?.lastRead?.timestamp).toEqual(Date.parse(post2.pubDate));
    });

    rssTest("Can get new posts when last read post was deleted", async ({ manager, feeds, rss }) => {
        feeds.feeds.push({
            name: "testFeed",
            url: "testFeed",
            lastRead: { guid: post1.guid._, timestamp: Date.parse(post1.pubDate) }
        });
        rss.textData.rss.channel.item.push(post2, post0);

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            created: Date.parse(post2.pubDate),
            id: post2.guid._,
            source: rss.textData.rss.channel.title,
            title: post2.title,
            url: post2.link
        }]);
        expect(feeds.feeds[0]?.lastRead?.guid).toEqual(post2.guid._);
        expect(feeds.feeds[0]?.lastRead?.timestamp).toEqual(Date.parse(post2.pubDate));
    });

    rssTest("Can catch failed request", async ({ manager, feeds, rss }) => {
        feeds.feeds.push({ name: "testFeed", url: "testFeed" });
        rss.response.ok = false;
        rss.response.status = 404;
        rss.response.text = vi.fn().mockImplementation(() => "Invalid");

        const result = manager.update(feeds);

        await expect(result).rejects.toThrow("[404] Invalid");
    });

    rssTest("Can catch invalid RSS feed", async ({ manager, feeds, rss }) => {
        feeds.feeds.push({ name: "testFeed", url: "testFeed" });
        rss.textData.rss.$.version = "INVALID";

        const result = manager.update(feeds);

        await expect(result).rejects.toThrow("Invalid RSS feed");
    });
});
