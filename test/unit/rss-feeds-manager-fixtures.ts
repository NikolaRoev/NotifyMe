import { type Mock, test, vi } from "vitest";
import { type RSSFeeds, RSSFeedsManager } from "../../src/feeds/rss-feeds-manager";
import { type RSSTextData, getDefaultTextData } from "../data/rss";
import { Builder } from "xml2js";



interface Fixtures {
    manager: RSSFeedsManager,
    feeds: RSSFeeds,
    rss: {
        textData: RSSTextData,
        response: {
            ok: boolean,
            status: number,
            text: Mock,
        }
    }
}


export const rssTest = test.extend<Fixtures>({
    manager: async ({}, use) => {
        await use(new RSSFeedsManager());
    },
    feeds: async ({ manager }, use) => {
        await use(manager.getEmptyFeeds());
    },
    rss: async ({}, use) => {
        const rss: Fixtures["rss"] = {
            textData: getDefaultTextData(),
            response: {
                ok: true,
                status: 200,
                text: vi.fn()
            }
        };
        rss.response.text = vi.fn().mockImplementation(() => {
            const builder = new Builder({ renderOpts: { pretty: false } });
            return builder.buildObject(rss.textData);
        });
        global.fetch = vi.fn().mockResolvedValue(rss.response);

        await use(rss);
    }
});
