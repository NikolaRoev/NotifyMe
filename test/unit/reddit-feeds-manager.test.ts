import { afterEach, beforeEach, expect, suite, vi } from "vitest";
import { submission0, submission1, submission2 } from "../data/reddit";
import { FeedSource } from "../../src/feeds/base-feeds-manager";
import { redditTest } from "./reddit-feeds-manager-fixtures";



beforeEach(() => {
    vi.useFakeTimers();
    vi.runAllTimersAsync().catch((reason) => { console.error(`Failed to run timers: ${reason}.`); });
});

afterEach(() => {
    vi.resetAllMocks();
});


suite("Adding feeds", () => {
    redditTest("Can add subreddit and feed", async ({ manager, feeds, reddit }) => {
        reddit.jsonData.data.children.push(submission0);
        reddit.jsonData.data.children.push(submission1);
        const remainingRequests = 1;
        const resetTime = 120;
        reddit.remainingRequests = remainingRequests;
        reddit.resetTime = resetTime;
        
        await manager.addFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser" });

        expect(feeds.subreddits).toEqual([{
            name: "testSubreddit",
            users: ["testUser"],
            lastRead: {
                name: submission0.data.name,
                timestamp: submission0.data.created
            }
        }]);
        expect(feeds.remainingRequests).toEqual(remainingRequests);
        expect((feeds.resetTimestamp ?? 0) - resetTime * 1000).toBeCloseTo(Date.now());
    });

    redditTest("Can add feed to existing subreddit", async ({ manager, feeds, reddit }) => {
        reddit.jsonData.data.children.push(submission0);
        const remainingRequests = 1;
        const resetTime = 120;
        reddit.remainingRequests = remainingRequests;
        reddit.resetTime = resetTime;

        await manager.addFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser0" });

        reddit.jsonData.data.children.splice(0, 0, submission1);

        await manager.addFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser1" });

        expect(feeds.subreddits).toEqual([{
            name: "testSubreddit",
            users: ["testUser0", "testUser1"],
            lastRead: {
                name: submission0.data.name,
                timestamp: submission0.data.created
            }
        }]);
        expect(feeds.remainingRequests).toEqual(remainingRequests);
        expect((feeds.resetTimestamp ?? 0) - resetTime * 1000).toBeCloseTo(Date.now());
    });

    redditTest("Can catch adding a duplicate feed", async ({ manager, feeds, reddit }) => {
        reddit.jsonData.data.children.push(submission0);

        await manager.addFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser0" });
        const result = manager.addFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser0" });

        await expect(result).rejects.toThrow("Feed of 'testUser0' in 'testSubreddit' already added");
    });
});


suite("Removing feeds", () => {
    redditTest("Can remove feed", ({ manager, feeds }) => {
        feeds.subreddits.push({ name: "testSubreddit", users: ["testUser0", "testUser1"] });

        manager.removeFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser0" });

        expect(feeds.subreddits[0]?.users).toEqual(["testUser1"]);
    });

    redditTest("Can remove subreddit when its only feed is removed", ({ manager, feeds }) => {
        feeds.subreddits.push({ name: "testSubreddit", users: ["testUser"] });

        manager.removeFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser" });

        expect(feeds.subreddits.length).toEqual(0);
    });

    redditTest("Can catch removing non-existant feed from existing subreddit", ({ manager, feeds }) => {
        feeds.subreddits.push({ name: "testSubreddit", users: ["testUser0"] });

        expect(() => { manager.removeFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser1" }); })
            .toThrow("No feed of 'testUser1' in 'testSubreddit'");
    });

    redditTest("Can catch removing non-existant feed from non-existant subreddit", ({ manager, feeds }) => {
        expect(() => { manager.removeFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser" }); })
            .toThrow("No feed of 'testUser' in 'testSubreddit'");
    });
});


suite("Checking for feed", () => {
    redditTest("Can check if feed exists", ({ manager, feeds }) => {
        feeds.subreddits.push({ name: "testSubreddit", users: ["testUser"] });

        const result =  manager.hasFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser" });

        expect(result).toBeTruthy();
    });

    redditTest("Can check if feed does not exist", ({ manager, feeds }) => {
        feeds.subreddits.push({ name: "testSubreddit", users: ["testUser0"] });

        const result = manager.hasFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser1" });

        expect(result).toBeFalsy();
    });

    redditTest("Can check if feed does not exist when subreddit also does not exist", ({ manager, feeds }) => {
        const result = manager.hasFeed(feeds, { source: FeedSource.Reddit, subreddit: "testSubreddit", user: "testUser" });

        expect(result).toBeFalsy();
    });
});


suite("Update", () => {
    redditTest("Can get new posts when there is no last read post", async ({ manager, feeds, reddit }) => {
        feeds.subreddits.push({ name: "testSubreddit", users: [submission0.data.author] });
        reddit.jsonData.data.children.push(submission0);

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            "created": submission0.data.created * 1000,
            "id": submission0.data.name,
            "source": "In r/testSubreddit by u/testAuthor0",
            "title": submission0.data.title,
            "url": submission0.data.url
        }]);
        expect(feeds.subreddits[0]?.lastRead?.name).toEqual(submission0.data.name);
        expect(feeds.subreddits[0]?.lastRead?.timestamp).toEqual(submission0.data.created);
        expect(global.fetch).toHaveBeenCalledOnce();
    });

    redditTest("Can get new posts when there is a last read post", async ({ manager, feeds, reddit }) => {
        feeds.subreddits.push({
            name: "testSubreddit",
            users: [submission2.data.author, submission0.data.author],
            lastRead: { name: submission1.data.name, timestamp: submission1.data.created}
        });
        reddit.jsonData.data.children.push(submission2, submission1, submission0);

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            "created": submission2.data.created * 1000,
            "id": submission2.data.name,
            "source": "In r/testSubreddit by u/testAuthor2",
            "title": submission2.data.title,
            "url": submission2.data.url
        }]);
        expect(feeds.subreddits[0]?.lastRead?.name).toEqual(submission2.data.name);
        expect(feeds.subreddits[0]?.lastRead?.timestamp).toEqual(submission2.data.created);
        expect(global.fetch).toHaveBeenCalledOnce();
    });

    redditTest("Can get new posts when last read post was deleted", async ({ manager, feeds, reddit }) => {
        feeds.subreddits.push({
            name: "testSubreddit",
            users: [submission2.data.author, submission0.data.author],
            lastRead: { name: submission1.data.name, timestamp: submission1.data.created}
        });
        reddit.jsonData.data.children.push(submission2, submission0);

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            "created": submission2.data.created * 1000,
            "id": submission2.data.name,
            "source": "In r/testSubreddit by u/testAuthor2",
            "title": submission2.data.title,
            "url": submission2.data.url
        }]);
        expect(feeds.subreddits[0]?.lastRead?.name).toEqual(submission2.data.name);
        expect(feeds.subreddits[0]?.lastRead?.timestamp).toEqual(submission2.data.created);
        expect(global.fetch).toHaveBeenCalledOnce();
    });

    redditTest("Will request again if last read post exists but was not encountered", async ({ manager, feeds, reddit }) => {
        feeds.subreddits.push({
            name: "testSubreddit",
            users: [submission2.data.author, submission0.data.author],
            lastRead: { name: submission1.data.name, timestamp: submission1.data.created}
        });
        const firstJsonData = structuredClone(reddit.jsonData);
        firstJsonData.data.children.push(submission2);
        const secondJsonData = structuredClone(reddit.jsonData);
        secondJsonData.data.children.push(submission1, submission0);
        reddit.response.json = vi.fn().mockResolvedValueOnce(firstJsonData).mockResolvedValueOnce(secondJsonData);
        
        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            "created": submission2.data.created * 1000,
            "id": submission2.data.name,
            "source": "In r/testSubreddit by u/testAuthor2",
            "title": submission2.data.title,
            "url": submission2.data.url
        }]);
        expect(feeds.subreddits[0]?.lastRead?.name).toEqual(submission2.data.name);
        expect(feeds.subreddits[0]?.lastRead?.timestamp).toEqual(submission2.data.created);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    redditTest("Will wait for remaining requests", async ({ manager, feeds, reddit }) => {
        vi.useRealTimers();
        reddit.jsonData.data.children.push(submission0);
        const waitTime = 2000;
        feeds.remainingRequests = 0;
        feeds.resetTimestamp = Date.now() + waitTime;
        feeds.subreddits.push({ name: "testSubreddit", users: [submission0.data.author] });

        const start = performance.now();
        await manager.update(feeds);
        const end = performance.now();

        // With some tolerance.
        const elapsed = end - start;
        expect(elapsed).toBeGreaterThan(waitTime * 0.90);
        expect(elapsed).toBeLessThan(waitTime * 1.10);
    }, { timeout: 2500 });

    redditTest("Will not request recursively if there are no posts", async ({ manager, feeds, reddit }) => {
        reddit.remainingRequests = 1;
        feeds.subreddits.push({
            name: "testSubreddit",
            users: [submission2.data.author, submission0.data.author],
            lastRead: { name: submission1.data.name, timestamp: submission1.data.created}
        });

        await manager.update(feeds);

        expect(global.fetch).toHaveBeenCalledOnce();
    });

    redditTest("Will stop at maximum request recursion depth", async ({ manager, feeds, reddit }) => {
        feeds.subreddits.push({
            name: "testSubreddit",
            users: ["testUser"],
            lastRead: { name: submission1.data.name, timestamp: submission1.data.created}
        });
        reddit.jsonData.data.children.push(submission2);

        await manager.update(feeds);

        expect(global.fetch).toHaveBeenCalledTimes(100);
    });

    redditTest("Can catch failed request", async ({ manager, feeds, reddit}) => {
        feeds.subreddits.push({ name: "testSubreddit", users: ["testUser"] });
        reddit.response.ok = false;
        reddit.response.status = 404;
        reddit.response.json = vi.fn().mockResolvedValue({ message: "Not Found", error: 404 });

        const result = manager.update(feeds);

        await expect(result).rejects.toThrow("[404] {\"message\":\"Not Found\",\"error\":404}");
    });

    redditTest("Can catch unexpected reponse JSON", async ({ manager, feeds, reddit }) => {
        feeds.subreddits.push({ name: "testSubreddit", users: ["testUser"] });
        reddit.jsonData.data.children.push({ invalid: true });

        const result = manager.update(feeds);

        await expect(result).rejects.toThrow("Unexpected response JSON");
    });
});
