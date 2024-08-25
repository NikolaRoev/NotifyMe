import { type KemonoFeeds, KemonoFeedsManager } from "../../src/backend/feeds/kemono-feeds-manager";
import { type Mock, test, vi } from "vitest";



type Fixtures = {
    manager: KemonoFeedsManager,
    feeds: KemonoFeeds,
    kemono: {
        jsonData: {
            id: string,
            name: string,
            updated: string
        },
        response: {
            ok: boolean,
            status: number,
            json: Mock,
        }
    }
}


export const kemonoTest = test.extend<Fixtures>({
    manager: async ({}, use) => {
        await use(new KemonoFeedsManager());
    },
    feeds: async ({ manager }, use) => {
        await use(manager.getEmptyFeeds());
    },
    kemono: async ({}, use) => {
        const kemono: Fixtures["kemono"] = {
            jsonData: { id: "", name: "", updated: "" },
            response: {
                ok: true,
                status: 200,
                json: vi.fn()
            }
        };
        kemono.response.json = vi.fn().mockImplementation(() => kemono.jsonData);
        global.fetch = vi.fn().mockResolvedValue(kemono.response);

        await use(kemono);
    }
});
