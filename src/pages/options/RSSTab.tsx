import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { FeedSource } from "../../feeds/base-feeds-manager";
import GeneralButton from "./GeneralButton";
import Input from "./Input";
import type { Message } from "../../message";
import type { RSSFeeds } from "../../feeds/rss-feeds-manager";
import RSSFeedsList from "./RSSFeedsList";
import type { Result } from "../../../utility/result";



function useRSSFeeds() {
    const [rssFeeds, setRSSFeeds] = useState<RSSFeeds>({feeds: []});
  
    const getRSSFeeds = () => {
        const message: Message = { type: "GetFeeds", source: FeedSource.RSS };
        chrome.runtime.sendMessage(message).then((feeds: RSSFeeds) => {
            setRSSFeeds(feeds);
        }).catch((reason: unknown) => { console.error(`Failed to update RSS feeds: ${reason}.`); });
    };

    useEffect(() => {
        getRSSFeeds();
    }, []);
  
    return { rssFeeds, getRSSFeeds };
}


export default function RSSTab() {
    const { rssFeeds, getRSSFeeds } = useRSSFeeds();
    const [feed, setFeed] = useState("");
    const feedInputRef = useRef<HTMLInputElement>(null);

    
    useEffect(() => {
        const message: Message = {
            type: "HasFeed",
            feedData: {
                source: FeedSource.RSS,
                url: feed
            }
        };
        chrome.runtime.sendMessage(message).then((value: boolean) => {
            feedInputRef.current?.setCustomValidity(value ? "Feed already added" : "");
        }).catch((reason: unknown) => { console.error(`Failed to validate RSS form: ${reason}.`); });
    }, [feed]);

    
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const message: Message = {
            type: "AddFeed",
            feedData: {
                source: FeedSource.RSS,
                url: feed
            }
        };
        chrome.runtime.sendMessage(message).then((result: Result<boolean>) => {
            if (result.ok) {
                getRSSFeeds();
                setFeed("");
            }
            else {
                alert(result.error);
            }
        }).catch((reason: unknown) => { console.error(`Failed to add RSS feed from options: ${reason}.`); });
    }

    
    return (
        <>
            <form className="flex gap-x-[10px] items-center" onSubmit={handleSubmit}>
                <label htmlFor="feed-input" className="text-[14px]">Feed:</label>
                <Input
                    id="feed-input"
                    ref={feedInputRef}
                    value={feed}
                    onInput={(event: ChangeEvent<HTMLInputElement>) => { setFeed(event.target.value); }}
                />
                <GeneralButton>Add</GeneralButton>
            </form>
            
            <RSSFeedsList rssFeeds={rssFeeds} getRSSFeeds={getRSSFeeds}/>
        </>
    );
}
