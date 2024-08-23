import { type BrowserContext, chromium, test } from "@playwright/test";
import { type RSSTextData, getDefaultTextData } from "../data/rss";
import { XMLBuilder } from "fast-xml-parser";
import path from "path";



type Fixtures = {
    context: BrowserContext,
    extensionId: string,
    reddit: {
        status: number,
        headers: Record<string, string>,
        jsonData: {
            data: {
                children: unknown[]
            }
        }
    },
    rss: {
        url: string,
        status: number,
        textData: RSSTextData
    },
    kemono: {
        status: number,
        jsonData: {
            id: string,
            name: string,
            updated: string
        }
    }
}


export const extensionTest = test.extend<Fixtures>({
    context: async ({}, use) => {
        const pathToExtension = path.join(path.resolve(), "dist", "chrome");
        const context = await chromium.launchPersistentContext("", {
            headless: false,
            args: [
                "--headless=new",
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`
            ]
        });

        await use(context);

        await context.close();
    },
    extensionId: async ({ context }, use) => {
        let [background] = context.serviceWorkers();
        if (!background) {
            background = await context.waitForEvent("serviceworker");
        }

        const extensionId = background.url().split("/")[2];
        if (!extensionId) {
            throw new Error("Could not get extension id");
        }

        await use(extensionId);
    },
    reddit: async ({ context }, use) => {
        const reddit: Fixtures["reddit"] = {
            status: 200,
            headers: { "x-ratelimit-remaining": "1", "x-ratelimit-reset": "1" },
            jsonData: {
                data: {
                    children: []
                }
            }
        };

        await context.route("https://www.reddit.com/**/*", async (route) => {
            await route.fulfill({
                contentType: "application/json",
                status: reddit.status,
                headers: reddit.headers,
                json: reddit.jsonData
            });
        });

        await use(reddit);
    },
    rss: async ({ context }, use) => {
        const rss: Fixtures["rss"] = {
            url: "https://www.rss.com/test",
            status: 200,
            textData: getDefaultTextData()
        };

        await context.route("https://www.rss.com/**/*", async (route) => {
            const builder = new XMLBuilder();
            await route.fulfill({
                contentType: "text/xml",
                status: rss.status,
                body: builder.build(rss.textData) as string
            });
        });

        await use(rss);
    },
    kemono: async ({ context }, use) => {
        const kemono: Fixtures["kemono"] = {
            status: 200,
            jsonData: {
                id: "",
                name: "",
                updated: ""
            }
        };

        await context.route("https://kemono.su/**/*", async (route) => {
            await route.fulfill({
                contentType: "application/json",
                status: kemono.status,
                json: kemono.jsonData
            });
        });

        await use(kemono);
    }
});
