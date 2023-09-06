import { type FeedData, FeedSource, type Feeds } from "./feeds/base-feeds-manager";
import { type Settings } from "./settings";


export type Message =
    { type: "GetSettings" } |
    { type: "SetSettings", newSettings: Settings } |
    { type: "GetFeeds", source: FeedSource } |
    { type: "AddFeed" | "RemoveFeed" | "HasFeed", feedData: FeedData } |
    { type: "GetUnreadPosts" } |
    { type: "ReadPosts", open: boolean, id?: string } |
    { type: "Update" } |
    { type: "ImportFeeds", feedsObject: { [Key in FeedSource]: Feeds } }
