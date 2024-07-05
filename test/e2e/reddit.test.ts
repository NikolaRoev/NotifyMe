import { submission0, submission1 } from "../data/reddit";
import { addRedditFeed } from "./utility";
import { expect } from "@playwright/test";
import { extensionTest } from "./fixtures";
import { formatDistanceToNowStrict } from "date-fns";



extensionTest.describe("Feeds", () => {
    extensionTest("Can add and then remove feed", async ({ page, extensionId, reddit }) => {
        reddit.jsonData.data.children.push(submission0);
        await addRedditFeed(page, extensionId, "testSubreddit", "testUser0", true);
        await addRedditFeed(page, extensionId, "testSubreddit", "testUser1", true);
        await page.getByRole("button", { name: "Remove testUser0" }).click({ clickCount: 2 });

        await expect(page.getByText("testSubreddit")).toHaveCount(1);
        await expect(page.getByText("testUser0")).toHaveCount(0);

        await page.getByRole("button", { name: "Remove testUser1" }).click({ clickCount: 2 });
        
        await expect(page.getByText("testSubreddit")).toHaveCount(0);
        await expect(page.getByText("testUser1")).toHaveCount(0);
    });

    extensionTest("Can catch failed fetch when adding feed", async ({ context, page, extensionId }) => {
        await context.route("https://www.reddit.com/**/*", (route) => route.abort());
        await addRedditFeed(page, extensionId, "testSubreddit", "testUser");
        
        await page.waitForEvent("dialog", async (dialog) => {
            expect(dialog.message()).toEqual("Failed to add feed: TypeError: Failed to fetch.");
            await dialog.accept();
            return true;
        });
    });

    extensionTest("Can catch failed request when adding feed", async ({ context, page, extensionId }) => {
        await context.route("https://www.reddit.com/**/*", async (route) => {
            await route.fulfill({ status: 404, json: { message: "Not Found", error: 404 } });
        });
        await addRedditFeed(page, extensionId, "testSubreddit", "testUser");
        
        await page.waitForEvent("dialog", async (dialog) => {
            expect(dialog.message()).toEqual("Failed to add feed: Error: [404] {\"message\":\"Not Found\",\"error\":404}.");
            await dialog.accept();
            return true;
        });
    });

    extensionTest("Can catch unexpected response JSON when adding feed", async ({ context, page, extensionId }) => {
        await context.route("https://www.reddit.com/**/*", async (route) => {
            await route.fulfill({ json: { invalid: true } });
        });
        await addRedditFeed(page, extensionId, "testSubreddit", "testUser");
        
        await page.waitForEvent("dialog", async (dialog) => {
            expect(dialog.message()).toEqual("Failed to add feed: Error: Unexpected response JSON: {\"invalid\":true}.");
            await dialog.accept();
            return true;
        });
    });

    extensionTest("Can filter feeds", async ({ page, extensionId, reddit }) => {
        reddit.jsonData.data.children.push(submission0);
        await addRedditFeed(page, extensionId, "testSubreddit0", "testUser0", true);
        await addRedditFeed(page, extensionId, "testSubreddit1", "testUser1", true);
        const searchInput = page.locator("[name='feeds-search-input']");
        await searchInput.fill("TEST");

        await expect(page.getByText("testUser")).toHaveCount(2);

        await searchInput.fill("NOT TEST");

        await expect(page.getByText("testUser")).toHaveCount(0);
    });
});


extensionTest.describe("Posts", () => {
    extensionTest.beforeEach(async ({ context, page, extensionId, reddit }) => {
        reddit.jsonData.data.children.push(submission0);
        await addRedditFeed(page, extensionId, "testSubreddit", submission1.data.author, true);

        reddit.jsonData.data.children.splice(0, 0, submission1);
        await context.waitForEvent("response");
        await page.goto(`chrome-extension://${extensionId}/popup.html`);
    });

    extensionTest("Can get new post", async ({ page }) => {
        await expect(page.getByText(submission1.data.title)).toBeVisible();
        await expect(page.getByText(`In r/testSubreddit by u/${submission1.data.author}`)).toBeVisible();
        await expect(page.getByText(formatDistanceToNowStrict(submission1.data.created * 1000, { addSuffix: true }))).toBeVisible();
    });

    extensionTest("Can open new post", async ({ context, page }) => {
        const newPostPagePromise = context.waitForEvent("page", (page) => {
            expect(page.url()).toEqual(submission1.data.url);
            return true;
        });

        await page.getByText(submission1.data.title).click();
        
        await newPostPagePromise;
        await expect(page.getByText(submission1.data.title)).toHaveCount(0);
        await expect(page.getByText("No unread posts")).toBeVisible();
    });

    extensionTest("Can mark new post as read", async ({ page }) => {
        await page.getByRole("button", { name: "Mark Read" }).click();

        await expect(page.getByText(submission1.data.title)).toHaveCount(0);
        await expect(page.getByText("No unread posts")).toBeVisible();
    });
});
