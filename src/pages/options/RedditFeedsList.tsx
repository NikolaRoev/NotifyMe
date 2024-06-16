import type { RedditFeeds, Subreddit } from "../../feeds/reddit-feeds-manager";
import ConfirmButton from "./ConfirmButton";
import { FeedSource } from "../../feeds/base-feeds-manager";
import type { Message } from "../../message";
import type { Result } from "../../../utility/result";



function RedditFeed({ subreddit, getRedditFeeds }: { subreddit: Subreddit, getRedditFeeds: () => void }) {
    function removeUser(user: string) {
        const message: Message = {
            type: "RemoveFeed",
            feedData: {
                source: FeedSource.Reddit,
                subreddit: subreddit.name,
                user: user
            }
        };
        chrome.runtime.sendMessage(message).then((result: Result<boolean>) => {
            if (!result.ok) {
                alert(`Failed to remove user ${user} from ${subreddit.name}: ${result.error}.`);
            }
            getRedditFeeds();
        }).catch((reason: unknown) => { console.error(`Failed to remove Reddit feed: ${reason}.`); });
    }
    

    const usersItems = subreddit.users.map((user) =>
        <div key={user} className="flex even:bg-neutral-100">
            <a
                className="pl-[30px] grow text-[16px] flex items-center hover:underline"
                href={`https://www.reddit.com/u/${user}`}
                target="_blank" rel="noreferrer"
            >{user}</a>
            <ConfirmButton
                initialText={"/icons/trash.svg"}
                confirmText={"/icons/x-circle.svg"}
                onClick={() => { removeUser(user); } }
                title={`Remove ${user}`}
            />
        </div>
    );

    return (
        <div>
            <a
                className="pl-[5px] grow text-[18px] flex items-center hover:underline"
                href={`https://www.reddit.com/r/${subreddit.name}`}
                target="_blank" rel="noreferrer"
            >{subreddit.name}</a>
            <div>{usersItems}</div>
        </div>
    );
}


export default function RedditFeedsList({ redditFeeds, getRedditFeeds }: { redditFeeds: RedditFeeds, getRedditFeeds: () => void }) {
    const redditFeedsItems = redditFeeds.subreddits.map((subreddit) =>
        <RedditFeed key={subreddit.name} subreddit={subreddit} getRedditFeeds={getRedditFeeds} />
    );

    return (
        <div className="mt-[30px] flex flex-col grow overflow-y-auto gap-y-[10px] border-[1px] border-neutral-600">
            {redditFeedsItems}
        </div>
    );
}
