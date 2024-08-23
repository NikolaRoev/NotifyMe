import type { RSSFeed, RSSFeeds } from "../../../backend/feeds/rss-feeds-manager";
import ConfirmButton from "../../components/ConfirmButton";
import { FeedSource } from "../../../backend/feeds/base-feeds-manager";
import FeedsList from "../components/FeedsList";
import { GroupedVirtuoso } from "react-virtuoso";
import type { Message } from "../../../backend/message";
import type { Result } from "../../../../utility/result";
import clsx from "clsx";



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


    return (
        <FeedsList
            data={(filter) => {
                const filteredData = rssFeeds.hosts.reduce((acc, curr) => {
                    const filteredFeeds = curr.feeds.filter((feed) => feed.name.toLowerCase().includes(filter.toLowerCase()));
                    return {
                        hostNames: [...acc.hostNames, curr.name],
                        feeds: [...acc.feeds, ...filteredFeeds],
                        groupCounts: [...acc.groupCounts, filteredFeeds.length]
                    };
                }, { hostNames: [] as string[], feeds: [] as RSSFeed[], groupCounts: [] as number[] });

                return <GroupedVirtuoso
                    groupCounts={filteredData.groupCounts}
                    groupContent={(index) => (
                        <a
                            className={clsx(
                                "grow p-[5px] flex items-center text-[18px] hover:underline",
                                "bg-white border-y border-t-neutral-600 border-b-neutral-300"
                            )}
                            href={filteredData.hostNames[index]}
                            target="_blank" rel="noreferrer"
                        >{filteredData.hostNames[index]}</a>
                    )}
                    itemContent={(index, groupIndex) => {
                        const hostName = filteredData.hostNames[groupIndex];
                        const feed = filteredData.feeds[index];

                        if (!hostName || !feed) {
                            throw new Error(
                                `Invalid host or feed: ${groupIndex}: ${hostName}, ${index} ${feed?.url}.`
                            );
                        }

                        return (
                            <div className={clsx("flex", {"bg-neutral-100": index % 2})}>
                                <a
                                    className="pl-[30px] grow text-[16px] flex items-center hover:underline"
                                    href={feed.url}
                                    target="_blank" rel="noreferrer"
                                >{feed.name}</a>
                                <ConfirmButton
                                    initialSrc={"/icons/trash.svg"}
                                    confirmSrc={"/icons/x-circle.svg"}
                                    onClick={() => { removeFeed(feed); }}
                                    title={`Remove ${feed.name}`}
                                />
                            </div>
                        );
                    }}
                />;
            }}
        />
    );
}
