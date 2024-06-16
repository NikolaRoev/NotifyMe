import { addRedditFeed, addRssFeed, setUpdatePeriod } from "./utility";
import { expect, test } from "@playwright/test";
import { post0, post1 } from "../data/rss";
import { FeedSource } from "../../src/feeds/base-feeds-manager";
import { extensionTest } from "./fixtures";
import { manifest } from "../../manifest";
import { submission0 } from "../data/reddit";



test.describe("Popup", () => {
    extensionTest("UI correct when there are no unread posts", async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/popup.html`);
        await expect(page.getByText("No unread posts")).toBeVisible();
    });

    extensionTest("Can open options", async ({ context, page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/popup.html`);

        const optionsPagePromise = context.waitForEvent("page", (page) => {
            expect(page.url()).toEqual(`chrome-extension://${extensionId}/options.html`);
            return true;
        });
        
        await page.getByRole("button", { name: "Options" }).click();
        await optionsPagePromise;
    });

    extensionTest("Can trigger update", async ({ page, extensionId, rss }) => {
        await setUpdatePeriod(page, extensionId, 99);
        await addRssFeed(page, extensionId, rss.url, rss.textData.rss.channel.title);
        rss.textData.rss.channel.item.push(post0);

        await page.goto(`chrome-extension://${extensionId}/popup.html`);
        await expect(page.getByText(post0.title)).toHaveCount(0);

        await page.getByRole("button", { name: "Update" }).click();
        await expect(page.getByText(post0.title)).toBeVisible();
    });

    extensionTest("Can open all posts", async ({ context, page, extensionId, rss }) => {
        await addRssFeed(page, extensionId, rss.url, rss.textData.rss.channel.title);
        rss.textData.rss.channel.item.push(post0, post1);
        await context.waitForEvent("response");

        await page.goto(`chrome-extension://${extensionId}/popup.html`);
        const page1 = context.waitForEvent("page");
        const page2 = context.waitForEvent("page");
        await page.getByRole("button", { name: "Open All" }).click();
        
        await expect(await page1).toHaveURL(post0.link);
        await expect(await page2).toHaveURL(post1.link);
        await expect(page.getByText("No unread posts")).toBeVisible();
    });

    extensionTest("Can mark all posts as read", async ({ context, page, extensionId, rss }) => {
        await addRssFeed(page, extensionId, rss.url, rss.textData.rss.channel.title);
        rss.textData.rss.channel.item.push(post0, post1);
        await context.waitForEvent("response");

        await page.goto(`chrome-extension://${extensionId}/popup.html`);
        await page.getByRole("button", { name: "Mark All Read" }).click();

        await expect(page.getByText(post0.title)).toHaveCount(0);
        await expect(page.getByText(post1.title)).toHaveCount(0);
        await expect(page.getByText("No unread posts")).toBeVisible();
    });
});


test.describe("Options", () => {
    extensionTest("Can change update period", async ({ context, page, extensionId, rss }) => {
        await addRssFeed(page, extensionId, rss.url, rss.textData.rss.channel.title);
        await setUpdatePeriod(page, extensionId, (1 / 60) * 3);

        await context.waitForEvent("request");
        const start = Date.now();
        await context.waitForEvent("request");
        const elapsed = Date.now() - start;

        // With some tolerance.
        expect(elapsed).toBeGreaterThan(3000 * 0.85);
        expect(elapsed).toBeLessThan(3000 * 1.15);
    });

    extensionTest("Can export feeds", async ({ page, extensionId, reddit, rss }) => {
        const expected = {
            [FeedSource.Reddit]: {
                remainingRequests: 1,
                resetTimestamp: expect.any(Number),
                subreddits: [{
                    lastRead: { name: submission0.data.name, timestamp: submission0.data.created },
                    name: "testSubreddit",
                    users: ["testUser"]
                }]
            },
            [FeedSource.RSS]: {
                feeds: [{
                    lastRead: { guid: post0.guid, timestamp: Date.parse(post0.pubDate) },
                    name: rss.textData.rss.channel.title,
                    url: rss.url
                }]
            }
        };

        await page.addInitScript(`{
            window.showSaveFilePicker = () => ({
                createWritable: () => ({
                    write: (value) => { console.log(value); },
                    close: () => {}
                })
            });
        }`);

        reddit.jsonData.data.children.push(submission0);
        rss.textData.rss.channel.item.push(post0);
        await addRedditFeed(page, extensionId, "testSubreddit", "testUser", true);
        await addRssFeed(page, extensionId, rss.url, rss.textData.rss.channel.title);

        const messagePromise = page.waitForEvent("console");
        await page.getByRole("tab", { name: "Settings" }).click();
        await page.getByRole("button", { name: "Export Feeds" }).click();
        const message = await messagePromise;
        const feeds: unknown = JSON.parse(message.text());
        expect(feeds).toEqual(expected);
    });

    extensionTest("Can import feeds", async ({ page, extensionId, rss }) => {
        const feeds = {
            [FeedSource.Reddit]: {
                remainingRequests: 1,
                resetTimestamp: expect.any(Number),
                subreddits: [{
                    lastRead: { name: submission0.data.name, timestamp: submission0.data.created },
                    name: "testSubreddit",
                    users: ["testUser"]
                }]
            },
            [FeedSource.RSS]: {
                feeds: [{
                    lastRead: { guid: post0.guid, timestamp: Date.parse(post0.pubDate) },
                    name: rss.textData.rss.channel.title,
                    url: rss.url
                }]
            }
        };

        await page.addInitScript(`{
            window.showOpenFilePicker = () => ([{
                getFile: () => ({
                    text: () => \`${JSON.stringify(feeds)}\`
                })
            }]);
        }`);

        await page.goto(`chrome-extension://${extensionId}/options.html`);
        await page.getByRole("tab", { name: "Settings" }).click();
        await page.getByRole("button", { name: "Import Feeds" }).click();

        await page.getByRole("tab", { name: "Reddit" }).click();
        expect(await page.getByText("testSubreddit").getAttribute("href")).toEqual("https://www.reddit.com/r/testSubreddit");
        expect(await page.getByText("testUser").getAttribute("href")).toEqual("https://www.reddit.com/u/testUser");
        
        await page.getByRole("tab", { name: "RSS" }).click();
        expect(await page.getByText(rss.textData.rss.channel.title).getAttribute("href")).toEqual(rss.url);
    });

    extensionTest("Info is correct", async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);
        await page.getByRole("tab", { name: "Settings" }).click();

        expect(await page.getByText(manifest.version).getAttribute("href")).toEqual("https://github.com/NikolaRoev/NotifyMe");
    });

    extensionTest("Log is displayed", async ({ context, page, extensionId }) => {
        await context.waitForEvent("request");
        await page.goto(`chrome-extension://${extensionId}/options.html`);
        await page.getByRole("tab", { name: "Log" }).click();

        await expect(page.getByText("Updating feeds.")).toBeVisible();
    });
});
