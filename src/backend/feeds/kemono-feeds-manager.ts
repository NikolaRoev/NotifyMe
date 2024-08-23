import { BaseFeedsManager, FeedSource, type Post } from "./base-feeds-manager";
import { wait } from "../../../utility/wait";
import { z } from "zod";



const creatorJsonObject = z.object({
    id: z.string(),
    name: z.string(),
    updated: z.string()
});
type CreatorJsonObject = z.infer<typeof creatorJsonObject>;


export type KemonoFeedData = {
    source: FeedSource.Kemono,
    service: string,
    id: string
}

export type Creator = {
    service: string,
    id: string,
    name: string,
    lastUpdated: number
}

export type KemonoFeeds = {
    creators: Creator[]
}


export class KemonoFeedsManager implements BaseFeedsManager {
    private static readonly TIME_BETWEEN_REQUESTS = 1000;

    
    getEmptyFeeds(): KemonoFeeds {
        return { creators: [] };
    }

    async addFeed(feeds: KemonoFeeds, feedData: KemonoFeedData): Promise<void> {
        const data = await this.request(feedData.service, feedData.id);

        if (feeds.creators.some((creator) => creator.service === feedData.service && creator.id === feedData.id)) {
            throw new Error(`Feed '${feedData.service}: ${data.name}(${feedData.id})' already added`);
        }

        feeds.creators.push({
            service: feedData.service,
            id: feedData.id,
            name: data.name,
            lastUpdated: Date.parse(data.updated)
        });
    }

    removeFeed(feeds: KemonoFeeds, feedData: KemonoFeedData): void {
        const creatorIndex = feeds.creators.findIndex(
            (creator) => creator.service === feedData.service && creator.id === feedData.id
        );

        if (creatorIndex !== -1) {
            feeds.creators.splice(creatorIndex, 1);
        }
        else {
            throw new Error(`No feed '${feedData.service}: ${feedData.id}'`);
        }
    }

    hasFeed(feeds: KemonoFeeds, feedData: KemonoFeedData): boolean {
        return feeds.creators.some((creator) => creator.service === feedData.service && creator.id === feedData.id);
    }

    async update(feeds: KemonoFeeds): Promise<Post[]> {
        const newPosts: Post[] = [];

        for (const creator of feeds.creators) {
            await this.getUpdated(newPosts, creator);
        }

        return newPosts;
    }

    private async getUpdated(newPosts: Post[], creator: Creator) {
        const data = await this.request(creator.service, creator.id);
        const updatedTimestamp = Date.parse(data.updated);

        if (updatedTimestamp > creator.lastUpdated) {
            newPosts.push({
                id: creator.id,
                title: `${creator.name} has been updated`,
                url: `https://kemono.su/${creator.service}/user/${creator.id}`,
                source: creator.service,
                created: updatedTimestamp
            });

            creator.lastUpdated = updatedTimestamp;
        }
    }

    private async request(service: string, id: string): Promise<CreatorJsonObject> {
        await wait(KemonoFeedsManager.TIME_BETWEEN_REQUESTS);

        const response = await fetch(`https://kemono.su/api/v1/${service}/user/${id}/profile`);
        const json: unknown = await response.json();

        if (!response.ok) {
            throw new Error(`[${response.status}] ${JSON.stringify(json)}`);
        }

        const result = creatorJsonObject.safeParse(json);
        if (!result.success) {
            throw new Error(`Unexpected response JSON: ${JSON.stringify(json)}`);
        }

        return result.data;
    }
}
