import { creatorData0, creatorData0Updated, creatorData1 } from "../data/kemono";
import { addKemonoFeed } from "./utility";
import { expect } from "@playwright/test";
import { extensionTest } from "./fixtures";
import { formatDistanceToNowStrict } from "date-fns";
import { wait } from "../../utility/wait";



extensionTest.describe("Feeds", () => {
    extensionTest("Can add and then remove feed", async ({ page, extensionId, kemono }) => {
        kemono.jsonData = creatorData0;
        await addKemonoFeed(page, extensionId, creatorData0.service, kemono.jsonData.id, kemono.jsonData.name, true);
        await page.getByRole("button", { name: `Remove ${kemono.jsonData.name}` }).click({ clickCount: 2 });

        await expect(page.getByText(kemono.jsonData.name)).toHaveCount(0);
    });

    extensionTest("Can catch failed fetch when adding feed", async ({ context, page, extensionId }) => {
        await context.route("https://kemono.su/api/v1/**/*", (route) => route.abort());
        await addKemonoFeed(page, extensionId, "patreon", "id", "name");
        
        await page.waitForEvent("dialog", async (dialog) => {
            expect(dialog.message()).toEqual("Failed to add feed: TypeError: Failed to fetch.");
            await dialog.accept();
            return true;
        });
    });

    extensionTest("Can catch failed request when adding feed", async ({ context, page, extensionId }) => {
        await context.route("https://kemono.su/api/v1/**/*", async (route) => {
            await route.fulfill({ status: 404, json: { message: "Not Found", error: 404 } });
        });
        await addKemonoFeed(page, extensionId, "patreon", "id", "name");
        
        await page.waitForEvent("dialog", async (dialog) => {
            expect(dialog.message()).toEqual("Failed to add feed: Error: [404] {\"message\":\"Not Found\",\"error\":404}.");
            await dialog.accept();
            return true;
        });
    });

    extensionTest("Can catch unexpected response JSON when adding feed", async ({ context, page, extensionId }) => {
        await context.route("https://kemono.su/api/v1/**/*", async (route) => {
            await route.fulfill({ json: { invalid: true } });
        });
        await addKemonoFeed(page, extensionId, "patreon", "id", "name");
        
        await page.waitForEvent("dialog", async (dialog) => {
            expect(dialog.message()).toEqual("Failed to add feed: Error: Unexpected response JSON: {\"invalid\":true}.");
            await dialog.accept();
            return true;
        });
    });

    extensionTest("Can filter feeds", async ({ page, extensionId, kemono }) => {
        kemono.jsonData = creatorData0;
        await addKemonoFeed(page, extensionId, creatorData0.service, kemono.jsonData.id, kemono.jsonData.name, true);
        kemono.jsonData = creatorData1;
        await addKemonoFeed(page, extensionId, creatorData1.service, kemono.jsonData.id, kemono.jsonData.name, true);
        const searchInput = page.locator("[name='feeds-search-input']");
        await searchInput.fill("TEST");

        await expect(page.getByText("testName")).toHaveCount(2);

        await searchInput.fill("NOT TEST");

        await expect(page.getByText("testName")).toHaveCount(0);
    });
});


extensionTest.describe("Posts", () => {
    extensionTest.beforeEach(async ({ context, page, extensionId, kemono }) => {
        kemono.jsonData = creatorData0;
        await addKemonoFeed(page, extensionId, creatorData0.service, kemono.jsonData.id, kemono.jsonData.name, true);
        kemono.jsonData = creatorData0Updated;
        await wait(1000);

        await context.waitForEvent("response");
        await page.goto(`chrome-extension://${extensionId}/popup.html`);
    });

    extensionTest("Can get new post", async ({ page }) => {
        await expect(page.getByText(creatorData0.name)).toBeVisible();
        await expect(page.getByText(formatDistanceToNowStrict(creatorData0Updated.updated, { addSuffix: true }))).toBeVisible();
    });

    extensionTest("Can open new post", async ({ page }) => {
        const newPostPagePromise = page.waitForRequest((request) => {
            if (request.url().startsWith("https://kemono.su/")) {
                expect(request.url()).toEqual(`https://kemono.su/${creatorData0.service}/user/${creatorData0.id}`);
                return false;
            }
            return true;
        });

        await page.getByText(creatorData0.name).click();
        
        await newPostPagePromise;
        await expect(page.getByText(creatorData0.name)).toHaveCount(0);
        await expect(page.getByText("No unread posts")).toBeVisible();
    });

    extensionTest("Can mark new post as read", async ({ page }) => {
        await page.getByRole("button", { name: "Mark Read" }).click();

        await expect(page.getByText(creatorData0.name)).toHaveCount(0);
        await expect(page.getByText("No unread posts")).toBeVisible();
    });
});
