import { FeedSource, type Feeds } from "../feeds/base-feeds-manager";
import type { Message } from "../message";
import type { RSSFeeds } from "../feeds/rss-feeds-manager";
import type { RedditFeeds } from "../feeds/reddit-feeds-manager";
import type { Result } from "../../utility/result";
import type { Settings } from "../settings";
import { createConfirmButton } from "../../utility/confirm-button";



const redditTabButton = document.getElementById("reddit-tab-button") as HTMLButtonElement;
const rssTabButton = document.getElementById("rss-tab-button") as HTMLButtonElement;
const settingsTabButton = document.getElementById("settings-tab-button") as HTMLButtonElement;

const redditTab = document.getElementById("reddit-tab") as HTMLDivElement;
const rssTab = document.getElementById("rss-tab") as HTMLDivElement;
const settingsTab = document.getElementById("settings-tab") as HTMLDivElement;


const redditAddForm = document.getElementById("reddit-add-form") as HTMLFormElement;
const subredditInput = document.getElementById("subreddit-input") as HTMLInputElement;
const userInput = document.getElementById("user-input") as HTMLInputElement;
const redditFeedsList = document.getElementById("reddit-feeds-list") as HTMLDivElement;

const rssAddForm = document.getElementById("rss-add-form") as HTMLFormElement;
const feedInput = document.getElementById("feed-input") as HTMLInputElement;
const rssFeedsList = document.getElementById("rss-feeds-list") as HTMLDivElement;

const settingsForm = document.getElementById("settings-form") as HTMLFormElement;
const alarmPeriodInput = document.getElementById("update-period-input") as HTMLInputElement;

const exportFeedsButton = document.getElementById("export-feeds-button") as HTMLButtonElement;
const importFeedsButton = document.getElementById("import-feeds-button") as HTMLButtonElement;



function validateRedditAddForm() {
    const message: Message = {
        type: "HasFeed",
        feedData: {
            source: FeedSource.Reddit,
            subreddit: subredditInput.value,
            user: userInput.value
        }
    };
    chrome.runtime.sendMessage(message).then((value: boolean) => {
        userInput.setCustomValidity(value ? "Feed already added" : "");
    }).catch((reason) => { console.error(`Failed to validate Reddit form: ${reason}.`); });
}

function validateRssAddForm() {
    const message: Message = {
        type: "HasFeed",
        feedData: {
            source: FeedSource.RSS,
            url: feedInput.value
        }
    };
    chrome.runtime.sendMessage(message).then((value: boolean) => {
        feedInput.setCustomValidity(value ? "Feed already added" : "");
    }).catch((reason) => { console.error(`Failed to validate RSS form: ${reason}.`); });
}

function updateRedditFeeds() {
    const message: Message = { type: "GetFeeds", source: FeedSource.Reddit };
    chrome.runtime.sendMessage(message).then((feeds: RedditFeeds) => {
        if (feeds.subreddits.length === 0) {
            redditFeedsList.innerHTML = "";
        }
        else {
            redditFeedsList.innerHTML = "";
            for (const subreddit of feeds.subreddits) {
                const subredditContainer = document.createElement("div");
                subredditContainer.innerHTML = `<a href="https://www.reddit.com/r/${subreddit.name}" target="_blank">${subreddit.name}</a>`;
    
                const usersList = document.createElement("div");
                for (const user of subreddit.users) {
                    const userContainer = document.createElement("div");
                    userContainer.innerHTML = `<a href="https://www.reddit.com/u/${user}" target="_blank">${user}</a>`;
    
                    const button = document.createElement("button");
                    button.innerHTML = "<img src=\"/icons/trash.svg\">";
                    button.title = `Remove ${user}`;
                    createConfirmButton(button, () => {
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
                            updateRedditFeeds();
                        }).catch((reason) => { console.error(`Failed to remove Reddit feed: ${reason}.`); });
    
                        
                    }, "<img src=\"/icons/x-circle.svg\">");
                    userContainer.appendChild(button);
    
                    usersList.appendChild(userContainer);
                }
                subredditContainer.appendChild(usersList);
                
                redditFeedsList.appendChild(subredditContainer);
            }
        }
    
        validateRedditAddForm();
    }).catch((reason) => { console.error(`Failed to update Reddit feeds: ${reason}.`); });
}

function updateRssFeeds() {
    const message: Message = { type: "GetFeeds", source: FeedSource.RSS };
    chrome.runtime.sendMessage(message).then((feeds: RSSFeeds) => {
        if (feeds.feeds.length === 0) {
            rssFeedsList.innerHTML = "";
        }
        else {
            rssFeedsList.innerHTML = "";
            for (const feed of feeds.feeds) {
                const container = document.createElement("div");
                container.innerHTML = `<a href="${feed.url}" target="_blank">${feed.name}</a>`;
    
                const button = document.createElement("button");
                button.innerHTML = "<img src=\"/icons/trash.svg\">";
                button.title = `Remove ${feed.name}`;
                createConfirmButton(button, () => {
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
                        updateRssFeeds();
                    }).catch((reason) => { console.error(`Failed to remove RSS feed: ${reason}.`); });
                }, "<img src=\"/icons/x-circle.svg\">");
                container.appendChild(button);
    
                rssFeedsList.appendChild(container);
            }
        }
    
        validateRssAddForm();
    }).catch((reason) => { console.error(`Failed to update RSS feeds: ${reason}.`); });
}

function setSettingsValues() {
    const message: Message = { type: "GetSettings" };
    chrome.runtime.sendMessage(message).then((settings: Settings) => {
        alarmPeriodInput.valueAsNumber = settings.updatePeriod;
    }).catch((reason) => { console.error(`Failed to get settings for options: ${reason}.`); });
}


redditAddForm.addEventListener("input", () => { validateRedditAddForm(); });

redditAddForm.addEventListener("submit", (ev) => {
    ev.preventDefault();

    const message: Message = {
        type: "AddFeed",
        feedData: {
            source: FeedSource.Reddit,
            subreddit: subredditInput.value,
            user: userInput.value
        }
    };
    chrome.runtime.sendMessage(message).then((result: Result<boolean>) => {
        if (result.ok) {
            updateRedditFeeds();
            redditAddForm.reset();
        }
        else {
            alert(result.error);
        }
    }).catch((reason) => { console.error(`Failed to add Reddit feed from options: ${reason}.`); });
});

rssAddForm.addEventListener("input", () => { validateRssAddForm(); });

rssAddForm.addEventListener("submit", (ev) => {
    ev.preventDefault();

    const message: Message = {
        type: "AddFeed",
        feedData: {
            source: FeedSource.RSS,
            url: feedInput.value
        }
    };
    chrome.runtime.sendMessage(message).then((result: Result<boolean>) => {
        if (result.ok) {
            updateRssFeeds();
            rssAddForm.reset();
        }
        else {
            alert(result.error);
        }
    }).catch((reason) => { console.error(`Failed to add RSS feed from options: ${reason}.`); });
});


settingsForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const settings: Settings = {
        updatePeriod: alarmPeriodInput.valueAsNumber
    };
    const message: Message = { type: "SetSettings", newSettings: settings };
    chrome.runtime.sendMessage(message)
        .then(() => { setSettingsValues(); })
        .catch((reason) => { console.error(`Failed to set settings from options: ${reason}.`); });
});


exportFeedsButton.addEventListener("click", () => {
    const createExportFile = async () => {
        const feeds = {
            [FeedSource.Reddit]: await chrome.runtime.sendMessage({ type: "GetFeeds", source: FeedSource.Reddit } as Message) as unknown,
            [FeedSource.RSS]: await chrome.runtime.sendMessage({ type: "GetFeeds", source: FeedSource.RSS } as Message) as unknown
        };
        const feedsString = JSON.stringify(feeds, undefined, 2);
    
        if (typeof showSaveFilePicker !== "undefined") {
            const handle = await showSaveFilePicker({
                suggestedName: "notifyme-backup.json",
                types: [{
                    description: "JSON Files",
                    accept: { "text/plain": [".json"] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(feedsString);
            await writable.close();
        }
        else {
            await navigator.clipboard.writeText(feedsString);
            alert("Feeds copied to clipboard.");
        }
    };
    createExportFile().catch((reason: Error) => {
        if (reason.name !== "AbortError") {
            const message = `Failed to export feeds: ${reason}.`;
            console.error(message);
            alert(message);
        }
    });
});

importFeedsButton.addEventListener("click", () => {
    const readImportFile = async () => {
        let contents;

        if (typeof window.showOpenFilePicker !== "undefined") {
            const [handle] = await showOpenFilePicker({
                types: [{
                    description: "JSON Files",
                    accept: { "text/plain": [".json"] }
                }]
            });
            const file = await handle.getFile();
            contents = await file.text();
        }
        else {
            contents = prompt("Enter feeds:");
        }

        if (contents) {
            const message: Message = {
                type: "ImportFeeds",
                combinedFeedsObject: JSON.parse(contents) as { [Key in FeedSource]: Feeds }
            };
            await chrome.runtime.sendMessage(message);
        }
    };

    readImportFile().then(() => {
        updateRedditFeeds();
        updateRssFeeds();
    }).catch((reason: Error) => {
        if (reason.name !== "AbortError") {
            const message = `Failed to import feeds: ${reason}.`;
            console.error(message);
            alert(message);
        }
    });
});


redditTabButton.addEventListener("click", () => {
    redditTabButton.classList.add("active");
    rssTabButton.classList.remove("active");
    settingsTabButton.classList.remove("active");

    redditTab.classList.remove("hidden");
    rssTab.classList.add("hidden");
    settingsTab.classList.add("hidden");
});

rssTabButton.addEventListener("click", () => {
    rssTabButton.classList.add("active");
    redditTabButton.classList.remove("active");
    settingsTabButton.classList.remove("active");

    rssTab.classList.remove("hidden");
    redditTab.classList.add("hidden");
    settingsTab.classList.add("hidden");
});

settingsTabButton.addEventListener("click", () => {
    settingsTabButton.classList.add("active");
    redditTabButton.classList.remove("active");
    rssTabButton.classList.remove("active");

    settingsTab.classList.remove("hidden");
    redditTab.classList.add("hidden");
    rssTab.classList.add("hidden");
});


updateRedditFeeds();
updateRssFeeds();
setSettingsValues();
