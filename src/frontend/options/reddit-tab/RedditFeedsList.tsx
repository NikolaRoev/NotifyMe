import ConfirmButton from "../../components/ConfirmButton";
import { FeedSource } from "../../../backend/feeds/base-feeds-manager";
import FeedsList from "../components/FeedsList";
import { GroupedVirtuoso } from "react-virtuoso";
import type { Message } from "../../../backend/message";
import type { RedditFeeds } from "../../../backend/feeds/reddit-feeds-manager";
import type { Result } from "../../../../utility/result";
import clsx from "clsx";



export default function RedditFeedsList({ redditFeeds, getRedditFeeds }: { redditFeeds: RedditFeeds, getRedditFeeds: () => void }) {
    function removeUser(subredditName: string, user: string) {
        const message: Message = {
            type: "RemoveFeed",
            feedData: {
                source: FeedSource.Reddit,
                subreddit: subredditName,
                user: user
            }
        };
        chrome.runtime.sendMessage(message).then((result: Result<boolean>) => {
            if (!result.ok) {
                alert(`Failed to remove user ${user} from ${subredditName}: ${result.error}.`);
            }
            getRedditFeeds();
        }).catch((reason: unknown) => { console.error(`Failed to remove Reddit feed: ${reason}.`); });
    }


    return (
        <FeedsList
            data={(filter) => {
                const filteredData = redditFeeds.subreddits.reduce((acc, curr) => {
                    const filteredUsers = curr.users.filter((user) => user.toLowerCase().includes(filter.toLowerCase()));
                    return {
                        subredditNames: [...acc.subredditNames, curr.name],
                        users: [...acc.users, ...filteredUsers],
                        groupCounts: [...acc.groupCounts, filteredUsers.length]
                    };
                }, { subredditNames: [] as string[], users: [] as string[], groupCounts: [] as number[] });

                return <GroupedVirtuoso
                    groupCounts={filteredData.groupCounts}
                    groupContent={(index) => (
                        <a
                            className={clsx(
                                "grow p-[5px] flex items-center text-[18px] hover:underline",
                                "bg-white border-y border-t-neutral-600 border-b-neutral-300"
                            )}
                            href={`https://www.reddit.com/r/${filteredData.subredditNames[index]}`}
                            target="_blank" rel="noreferrer"
                        >{filteredData.subredditNames[index]}</a>
                    )}
                    itemContent={(index, groupIndex) => {
                        const subredditName = filteredData.subredditNames[groupIndex];
                        const user = filteredData.users[index];

                        if (!subredditName || !user) {
                            throw new Error(
                                `Invalid subreddit or user: ${groupIndex}: ${subredditName}, ${index} ${user}.`
                            );
                        }

                        return (
                            <div className={clsx("flex", {"bg-neutral-100": index % 2})}>
                                <a
                                    className="pl-[30px] grow text-[16px] flex items-center hover:underline"
                                    href={`https://www.reddit.com/u/${user}`}
                                    target="_blank" rel="noreferrer"
                                >{user}</a>
                                <ConfirmButton
                                    initialSrc={"/icons/trash.svg"}
                                    confirmSrc={"/icons/x-circle.svg"}
                                    onClick={() => { removeUser(subredditName, user); }}
                                    title={`Remove ${user}`}
                                />
                            </div>
                        );
                    }}
                />;
            }}
        />
    );
}
