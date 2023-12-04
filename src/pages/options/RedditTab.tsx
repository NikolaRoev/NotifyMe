import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { FeedSource } from "../../feeds/base-feeds-manager";
import GeneralButton from "./GeneralButton";
import Input from "./Input";
import type { Message } from "../../message";
import type { RedditFeeds } from "../../feeds/reddit-feeds-manager";
import RedditFeedsList from "./RedditFeedsList";
import type { Result } from "../../../utility/result";



function useRedditFeeds() {
    const [redditFeeds, setRedditFeeds] = useState<RedditFeeds>({subreddits: []});
  
    const getRedditFeeds = () => {
        const message: Message = { type: "GetFeeds", source: FeedSource.Reddit };
        chrome.runtime.sendMessage(message).then((feeds: RedditFeeds) => {
            setRedditFeeds(feeds);
        }).catch((reason) => { console.error(`Failed to update Reddit feeds: ${reason}.`); });
    };

    useEffect(() => {
        getRedditFeeds();
    }, []);
  
    return { redditFeeds, getRedditFeeds };
}


export default function RedditTab() {
    const { redditFeeds, getRedditFeeds } = useRedditFeeds();
    const [inputs, setInputs] = useState<{ subreddit: string, user: string }>({ subreddit: "", user: "" });
    const userInputRef = useRef<HTMLInputElement>(null);

    
    useEffect(() => {
        const message: Message = {
            type: "HasFeed",
            feedData: {
                source: FeedSource.Reddit,
                subreddit: inputs.subreddit,
                user: inputs.user
            }
        };
        chrome.runtime.sendMessage(message).then((value: boolean) => {
            userInputRef.current?.setCustomValidity(value ? "Feed already added" : "");
        }).catch((reason) => { console.error(`Failed to validate Reddit form: ${reason}.`); });
    }, [inputs]);


    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const message: Message = {
            type: "AddFeed",
            feedData: {
                source: FeedSource.Reddit,
                subreddit: inputs.subreddit,
                user: inputs.user
            }
        };
        chrome.runtime.sendMessage(message).then((result: Result<boolean>) => {
            if (result.ok) {
                getRedditFeeds();
                setInputs({subreddit: "", user: ""});
            }
            else {
                alert(result.error);
            }
        }).catch((reason) => { console.error(`Failed to add Reddit feed from options: ${reason}.`); });
    }

    
    return (
        <>
            <form className="flex gap-x-[10px] items-center" onSubmit={handleSubmit}>
                <label htmlFor="subreddit-input" className="text-[14px]">Subreddit:</label>
                <Input
                    id="subreddit-input"
                    value={inputs.subreddit}
                    onInput={(event: ChangeEvent<HTMLInputElement>) => { setInputs({...inputs, subreddit: event.target.value}); }}
                />
                <label htmlFor="user-input" className="text-[14px]">User:</label>
                <Input
                    id="user-input"
                    ref={userInputRef}
                    value={inputs.user}
                    onInput={(event: ChangeEvent<HTMLInputElement>) => { setInputs({...inputs, user: event.target.value}); }}
                />
                <GeneralButton>Add</GeneralButton>
            </form>
            
            <RedditFeedsList redditFeeds={redditFeeds} getRedditFeeds={getRedditFeeds} />
        </>
    );
}
