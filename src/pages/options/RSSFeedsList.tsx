import type { RSSFeed, RSSFeeds } from "../../feeds/rss-feeds-manager";
import ConfirmButton from "./ConfirmButton";
import { FeedSource } from "../../feeds/base-feeds-manager";
import type { Message } from "../../message";
import type { Result } from "../../../utility/result";



export default function RSSFeedsList({ rssFeeds, getRSSFeeds }: { rssFeeds: RSSFeeds, getRSSFeeds: () => void }) {
    function removeFeed(feed: RSSFeed) {
        const message: Message = {
            type: "RemoveFeed",
            feedData: {
                source: FeedSource.RSS,
                url: feed.url
            }
        };
        chrome.runtime.sendMessage(message).then((result: Result<boolean>) => {
            if (!result.ok) {
                alert(`Failed to remove feed ${feed.name}: ${result.error}.`);
            }
            getRSSFeeds();
        }).catch((reason: unknown) => { console.error(`Failed to remove RSS feed: ${reason}.`); });
    }


    const rssFeedsItems = rssFeeds.feeds.map((feed) =>
        <div key={feed.url} className="flex even:bg-neutral-100">
            <a
                className="pl-[5px] grow text-[16px] flex items-center hover:underline"
                href={feed.url}
                target="_blank" rel="noreferrer"
            >{feed.name}</a>
            <ConfirmButton
                initialText={"/icons/trash.svg"}
                confirmText={"/icons/x-circle.svg"}
                onClick={() => { removeFeed(feed); } }
                title={`Remove ${feed.name}`}
            />
        </div>
    );

    return (
        <div className="mt-[30px] flex flex-col grow overflow-y-auto border-[1px] border-neutral-600">
            {rssFeedsItems}
        </div>
    );
}
