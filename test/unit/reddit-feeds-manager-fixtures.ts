import { type Mock, test, vi } from "vitest";
import { type RedditFeeds, RedditFeedsManager } from "../../src/feeds/reddit-feeds-manager";



type Fixtures = {
    manager: RedditFeedsManager,
    feeds: RedditFeeds,
    reddit: {
        remainingRequests: number,
        resetTime: number,
        jsonData: {
            data: {
                children: unknown[]
            }
        },
        response: {
            ok: boolean,
            status: number,
            headers: {
                get: Mock
            },
            json: Mock,
        }
    }
}


export const redditTest = test.extend<Fixtures>({
    manager: async ({}, use) => {
        await use(new RedditFeedsManager());
    },
    feeds: async ({ manager }, use) => {
        await use(manager.getEmptyFeeds());
    },
    reddit: async ({}, use) => {
        const reddit: Fixtures["reddit"] = {
            remainingRequests: 99,
            resetTime: 0,
            jsonData: {
                data: {
                    children: []
                }
            },
            response: {
                ok: true,
                status: 200,
                headers: {
                    get: vi.fn()
                },
                json: vi.fn()
            }
        };
        reddit.response.headers.get = vi.fn().mockImplementation((name: string) => {
            if (name === "x-ratelimit-remaining") { return reddit.remainingRequests.toString(); }
            else if (name === "x-ratelimit-reset") { return reddit.resetTime.toString(); }
            else { throw new Error(`Invalid header value: ${name}.`); }
        });
        reddit.response.json = vi.fn().mockResolvedValue(reddit.jsonData);
        global.fetch = vi.fn().mockResolvedValue(reddit.response);

        await use(reddit);
    }
});
