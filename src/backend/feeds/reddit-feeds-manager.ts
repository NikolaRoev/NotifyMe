import { BaseFeedsManager, FeedSource, type Post } from "./base-feeds-manager";
import { wait } from "../../../utility/wait";
import { z } from "zod";



const submissionJsonObject = z.object({
    data: z.object({
        title: z.string(),
        name: z.string(),
        author: z.string(),
        url: z.string(),
        created: z.number()
    })
});
type SubmissionJsonObject = z.infer<typeof submissionJsonObject>;

const redditJsonObject = z.object({
    data: z.object({
        children: submissionJsonObject.array()
    })
});


export type RedditFeedData = {
    source: FeedSource.Reddit,
    subreddit: string,
    user: string
}

export type Subreddit = {
    name: string,
    users: string[],
    lastRead?: { name: string, timestamp: number }
}

export type RedditFeeds = {
    subreddits: Subreddit[],
    remainingRequests?: number,
    resetTimestamp?: number
}


export class RedditFeedsManager implements BaseFeedsManager {
    private static readonly TIME_BETWEEN_REQUESTS = 1000;
    private static readonly MAX_REQUEST_DEPTH = 100;

    private CURRENT_REQUEST_DEPTH = 0;


    getEmptyFeeds(): RedditFeeds {
        return { subreddits: [] };
    }

    async addFeed(feeds: RedditFeeds, feedData: RedditFeedData): Promise<void> {
        const subredditObj = feeds.subreddits.find((value) => value.name === feedData.subreddit);

        if (subredditObj) {
            if (subredditObj.users.includes(feedData.user)) {
                throw new Error(`Feed of '${feedData.user}' in '${feedData.subreddit}' already added`);
            }
            subredditObj.users.push(feedData.user);
        }
        else {
            const submissions = await this.request(feeds, `https://www.reddit.com/r/${feedData.subreddit}/new.json?limit=1`);

            const subreddit: Subreddit = { name: feedData.subreddit, users: [feedData.user] };
            if (submissions[0]) {
                subreddit.lastRead = { name: submissions[0].data.name, timestamp: submissions[0].data.created };
            }

            feeds.subreddits.push(subreddit);
        }
    }

    removeFeed(feeds: RedditFeeds, feedData: RedditFeedData): void {
        const subredditIndex = feeds.subreddits.findIndex((value) => value.name === feedData.subreddit);
        const subredditObj = feeds.subreddits[subredditIndex];

        if (subredditObj?.users.includes(feedData.user)) {
            subredditObj.users = subredditObj.users.filter((value) => value !== feedData.user);

            if (subredditObj.users.length === 0) {
                feeds.subreddits.splice(subredditIndex, 1);
            }
        }
        else {
            throw new Error(`No feed of '${feedData.user}' in '${feedData.subreddit}'`);
        }
    }

    hasFeed(feeds: RedditFeeds, feedData: RedditFeedData): boolean {
        const subredditObj = feeds.subreddits.find((value) => value.name === feedData.subreddit);
        return !!(subredditObj?.users.includes(feedData.user));
    }

    async update(feeds: RedditFeeds): Promise<Post[]> {
        const newPosts: Post[] = [];

        for (const subreddit of feeds.subreddits) {
            newPosts.push(...await this.getPosts(feeds, subreddit));
        }

        return newPosts;
    }

    private async getPosts(feeds: RedditFeeds, subreddit: Subreddit): Promise<Post[]> {
        const newPosts: Post[] = [];
        const initialSubmissions = await this.request(feeds, `https://www.reddit.com/r/${subreddit.name}/new.json?limit=100`);

        newPosts.push(...await this.recurseGetPosts(feeds, subreddit, initialSubmissions));

        if (initialSubmissions[0]) {
            subreddit.lastRead = { name: initialSubmissions[0].data.name, timestamp: initialSubmissions[0].data.created };
        }
        return newPosts;
    }

    private async recurseGetPosts(feeds: RedditFeeds, subreddit: Subreddit, submissions: SubmissionJsonObject[]): Promise<Post[]> {
        this.CURRENT_REQUEST_DEPTH += 1;
        const newPosts: Post[] = [];

        for (const submission of submissions) {
            if (subreddit.lastRead && (
                submission.data.name === subreddit.lastRead.name ||
                submission.data.created < subreddit.lastRead.timestamp
            )) {
                return newPosts;
            }

            if (subreddit.users.includes(submission.data.author)) {
                newPosts.push({
                    id: submission.data.name,
                    title: submission.data.title,
                    url: submission.data.url,
                    source: `In r/${subreddit.name} by u/${submission.data.author}`,
                    created: submission.data.created * 1000 // Reddit uses seconds based UNIX timestamps.
                });
            }
        }

        if (!subreddit.lastRead) {
            return newPosts;
        }

        if (this.CURRENT_REQUEST_DEPTH >= RedditFeedsManager.MAX_REQUEST_DEPTH) {
            return newPosts;
        }

        const lastSubmission = submissions.at(-1);
        if (lastSubmission) {
            const url = `https://www.reddit.com/r/${subreddit.name}/new.json?limit=100&after=${lastSubmission.data.name}`;
            newPosts.push(...await this.recurseGetPosts(feeds, subreddit, await this.request(feeds, url)));
        }

        return newPosts;
    }

    private async request(feeds: RedditFeeds, url: string): Promise<SubmissionJsonObject[]> {
        await wait(RedditFeedsManager.TIME_BETWEEN_REQUESTS);
        if (feeds.resetTimestamp !== undefined && feeds.remainingRequests === 0 && feeds.resetTimestamp > Date.now()) {
            await wait(feeds.resetTimestamp - Date.now());
        }

        const response = await fetch(url);
        const json: unknown = await response.json();

        const remainingRequests = response.headers.get("x-ratelimit-remaining");
        const resetTime = response.headers.get("x-ratelimit-reset");
        if (remainingRequests !== null && resetTime !== null) {
            feeds.remainingRequests = parseInt(remainingRequests);
            feeds.resetTimestamp = Date.now() + parseInt(resetTime) * 1000; // Reddit uses seconds based UNIX timestamps.
        }

        if (!response.ok) {
            throw new Error(`[${response.status}] ${JSON.stringify(json)}`);
        }

        const result = redditJsonObject.safeParse(json);
        if (!result.success) {
            throw new Error(`Unexpected response JSON: ${JSON.stringify(json)}`);
        }

        return result.data.data.children;
    }
}
