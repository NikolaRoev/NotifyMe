import { afterEach, beforeEach, expect, suite, vi } from "vitest";
import { creatorData0, creatorData0Updated } from "../data/kemono";
import { FeedSource } from "../../src/backend/feeds/base-feeds-manager";
import { kemonoTest } from "./kemono-feeds-manager-fixtures";



beforeEach(() => {
    vi.useFakeTimers();
    vi.runAllTimersAsync().catch((reason: unknown) => {
        console.error(`Failed to run timers: ${reason}.`);
    });
});

afterEach(() => {
    vi.resetAllMocks();
});


suite("Adding feeds", () => {
    kemonoTest("Can add feed", async ({ manager, feeds, kemono }) => {
        kemono.jsonData = { id: creatorData0.id, name: creatorData0.name, updated: creatorData0.updated };

        await manager.addFeed(feeds, { source: FeedSource.Kemono, service: creatorData0.service, id: creatorData0.id });

        expect(feeds.creators).toEqual([{
            service: creatorData0.service,
            id: creatorData0.id,
            name: creatorData0.name,
            lastUpdated: Date.parse(creatorData0.updated)
        }]);
    });

    kemonoTest("Can catch adding a duplicate feed", async ({ manager, feeds, kemono }) => {
        feeds.creators = [{
            service: creatorData0.service,
            id: creatorData0.id,
            name: creatorData0.name,
            lastUpdated: Date.parse(creatorData0.updated)
        }];
        kemono.jsonData = { id: creatorData0.id, name: creatorData0.name, updated: creatorData0.updated };

        const result = manager.addFeed(feeds, { source: FeedSource.Kemono, service: creatorData0.service, id: creatorData0.id });

        await expect(result).rejects.toThrow("Feed 'patreon: testName0(id0)' already added");
    });
});

suite("Removing feeds", () => {
    kemonoTest("Can remove feed", ({ manager, feeds }) => {
        feeds.creators = [{
            service: creatorData0.service,
            id: creatorData0.id,
            name: creatorData0.name,
            lastUpdated: Date.parse(creatorData0.updated)
        }];

        manager.removeFeed(feeds, { source: FeedSource.Kemono, service: creatorData0.service, id: creatorData0.id });

        expect(feeds.creators).toEqual([]);
    });

    kemonoTest("Can catch removing non-existant feed", ({ manager, feeds }) => {
        expect(() => { manager.removeFeed(feeds, { source: FeedSource.Kemono, service: "service", id: "id" }); })
            .toThrow("No feed 'service: id'");
    });
});


suite("Checking for feed", () => {
    kemonoTest("Can check if feed exists", ({ manager, feeds }) => {
        feeds.creators = [{
            service: creatorData0.service,
            id: creatorData0.id,
            name: creatorData0.name,
            lastUpdated: Date.parse(creatorData0.updated)
        }];

        const result = manager.hasFeed(feeds, { source: FeedSource.Kemono, service: creatorData0.service, id: creatorData0.id });

        expect(result).toBeTruthy();
    });

    kemonoTest("Can check if feed does not exist", ({ manager, feeds }) => {
        feeds.creators = [{
            service: creatorData0.service,
            id: creatorData0.id,
            name: creatorData0.name,
            lastUpdated: Date.parse(creatorData0.updated)
        }];

        const result = manager.hasFeed(feeds, { source: FeedSource.Kemono, service: creatorData0.service, id: "otherId" });

        expect(result).toBeFalsy();
    });
});


suite("Update", () => {
    kemonoTest("Can get new posts", async ({ manager, feeds, kemono }) => {
        feeds.creators = [{
            service: creatorData0.service,
            id: creatorData0.id,
            name: creatorData0.name,
            lastUpdated: Date.parse(creatorData0.updated)
        }];
        kemono.jsonData = { id: creatorData0Updated.id, name: creatorData0Updated.name, updated: creatorData0Updated.updated };

        const posts = await manager.update(feeds);

        expect(posts).toEqual([{
            created: Date.parse(creatorData0Updated.updated),
            id: creatorData0Updated.id,
            source: creatorData0Updated.service,
            title: `${creatorData0Updated.name} has been updated`,
            url: `https://kemono.cr/${creatorData0Updated.service}/user/${creatorData0Updated.id}`
        }]);
        expect(feeds.creators[0]?.lastUpdated).toEqual(Date.parse(creatorData0Updated.updated));
    });

    kemonoTest("Can catch failed request", async ({ manager, feeds, kemono }) => {
        feeds.creators = [{
            service: creatorData0.service,
            id: creatorData0.id,
            name: creatorData0.name,
            lastUpdated: Date.parse(creatorData0.updated)
        }];
        kemono.response.ok = false;
        kemono.response.status = 404;
        kemono.response.json = vi.fn().mockImplementation(() => ({ message: "Not Found", error: 404 }));

        const result = manager.update(feeds);

        await expect(result).rejects.toThrow("[404] {\"message\":\"Not Found\",\"error\":404}");
    });

    kemonoTest("Can catch unexpected reponse JSON", async ({ manager, feeds, kemono }) => {
        feeds.creators = [{
            service: creatorData0.service,
            id: creatorData0.id,
            name: creatorData0.name,
            lastUpdated: Date.parse(creatorData0.updated)
        }];
        kemono.response.json = vi.fn().mockImplementation(() => ({ invalid: true }));

        const result = manager.update(feeds);

        await expect(result).rejects.toThrow("Unexpected response JSON");
    });
});
