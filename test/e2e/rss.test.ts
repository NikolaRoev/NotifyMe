import { expect, test } from "@playwright/test";
import { addRssFeed } from "./utility";
import { extensionTest } from "./fixtures";
import { formatDistanceToNowStrict } from "date-fns";
import { post0 } from "../data/rss";



test.describe("Feeds", () => {
    extensionTest("Can add and then remove feed", async ({ page, extensionId, rss }) => {
        rss.textData.rss.channel.item.push(post0);
        await addRssFeed(page, extensionId, rss.url, rss.textData.rss.channel.title);
        await page.getByRole("button", { name: `Remove ${rss.textData.rss.channel.title}`}).click({ clickCount: 2 });

        await expect(page.getByText(rss.textData.rss.channel.title)).toHaveCount(0);
    });

    extensionTest("Can catch failed fetch when adding feed", async ({ context, page, extensionId, rss }) => {
        await context.route(rss.url, (route) => route.abort());
        await addRssFeed(page, extensionId, rss.url);
        
        await page.waitForEvent("dialog", async (dialog) => {
            expect(dialog.message()).toEqual("Failed to add feed: TypeError: Failed to fetch.");
            await dialog.accept();
            return true;
        });
    });

    extensionTest("Can catch failed request when adding feed", async ({ context, page, extensionId, rss }) => {
        await context.route(rss.url, async (route) => {
            await route.fulfill({ status: 404, body: "Invalid" });
        });
        await addRssFeed(page, extensionId, rss.url);
        
        await page.waitForEvent("dialog", async (dialog) => {
            expect(dialog.message()).toEqual("Failed to add feed: Error: [404] Invalid.");
            await dialog.accept();
            return true;
        });
    });

    extensionTest("Can catch invalid RSS feed", async ({ page, extensionId, rss }) => {
        rss.textData.rss.channel.item.push({ invalid: true });
        await addRssFeed(page, extensionId, rss.url);

        await page.waitForEvent("dialog", async (dialog) => {
            expect(dialog.message()).toContain("Failed to add feed: Error: Failed to get RSS feed:");
            await dialog.accept();
            return true;
        });
    });
});


test.describe("Posts", () => {
    extensionTest.beforeEach(async ({ context, page, extensionId, rss }) => {
        await addRssFeed(page, extensionId, rss.url, rss.textData.rss.channel.title);

        rss.textData.rss.channel.item.push(post0);
        await context.waitForEvent("response");
        await page.goto(`chrome-extension://${extensionId}/popup.html`);
    });

    extensionTest("Can get new post", async ({ page, rss }) => {
        await expect(page.getByText(post0.title)).toBeVisible();
        await expect(page.getByText(rss.textData.rss.channel.title)).toBeVisible();
        await expect(page.getByText(formatDistanceToNowStrict(Date.parse(post0.pubDate), { addSuffix: true }))).toBeVisible();
    });

    extensionTest("Can open new post", async ({ context, page }) => {
        const newPostPagePromise = context.waitForEvent("page", (page) => {
            expect(page.url()).toEqual(post0.link);
            return true;
        });

        await page.getByText(post0.title).click();
        await newPostPagePromise;

        await expect(page.getByText(post0.title)).toHaveCount(0);
        await expect(page.getByText("No unread posts")).toBeVisible();
    });

    extensionTest("Can mark new post as read", async ({ page }) => {
        await page.getByRole("button", { name: "Mark Read" }).click();

        await expect(page.getByText(post0.title)).toHaveCount(0);
        await expect(page.getByText("No unread posts")).toBeVisible();
    });
});
