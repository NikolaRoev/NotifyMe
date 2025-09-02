import { type Page, expect } from "@playwright/test";



export async function addRedditFeed(page: Page, extensionId: string, subreddit: string, user: string, verify = false) {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.getByRole("tab", { name: "Reddit" }).click();
    await page.getByLabel("Subreddit:").fill(subreddit);
    await page.getByLabel("User:").fill(user);
    await page.getByRole("button", { name: "Add" }).click();

    if (verify) {
        expect(await page.getByText(subreddit).getAttribute("href")).toEqual(`https://www.reddit.com/r/${subreddit}`);
        expect(await page.getByText(user).getAttribute("href")).toEqual(`https://www.reddit.com/u/${user}`);
    }
}

export async function addRssFeed(page: Page, extensionId: string, url: string, title?: string) {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.getByRole("tab", { name: "RSS" }).click();
    await page.getByLabel("Feed:").fill(url);
    await page.getByRole("button", { name: "Add" }).click();

    if (title !== undefined) {
        expect(await page.getByText(title).getAttribute("href")).toEqual(url);
    }
}

export async function addKemonoFeed(page: Page, extensionId: string, service: string, id: string, name: string, verify = false) {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.getByRole("tab", { name: "Kemono" }).click();
    await page.getByLabel("Service:").fill(service);
    await page.getByLabel("Id:").fill(id);
    await page.getByRole("button", { name: "Add" }).click();

    if (verify) {
        expect(await page.getByText(name).getAttribute("href")).toEqual(`https://kemono.cr/${service}/user/${id}`);
    }
}

export async function setUpdatePeriod(page: Page, extensionId: string, updatePeriod: number) {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.getByRole("tab", { name: "Settings" }).click();
    await page.getByLabel("Update Period:").fill(updatePeriod.toString());
    await page.getByRole("button", { name: "Apply" }).click();
}
