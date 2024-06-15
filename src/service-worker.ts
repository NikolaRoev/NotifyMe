import * as Application from "./application";
import type { Message } from "./message";
import { checkAlarm } from "./alarm";



Application.getSettings()
    .then(async (settings) => { await checkAlarm(settings.updatePeriod); })
    .catch((reason) => { console.error(`Failed to check alarm: ${reason}.`); });

chrome.alarms.onAlarm.addListener(() => {
    Application.update()
        .catch((reason) => { console.error(`Failed to update on alarm: ${reason}.`); });
});

chrome.notifications.onClicked.addListener((notificationId) => {
    Application.readPosts(true, notificationId)
        .catch((reason) => { console.error(`Failed to read post(s) on click: ${reason}.`); });
});

chrome.notifications.onButtonClicked.addListener((notificationId) => {
    Application.readPosts(false, notificationId)
        .catch((reason) => { console.error(`Failed to read post(s) on button click: ${reason}.`); });
});

chrome.runtime.onMessage.addListener((message : Message, _, sendResponse) => {
    switch (message.type) {
        case "GetSettings": {
            Application.getSettings()
                .then((value) => { sendResponse(value); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        }
        case "SetSettings": {
            Application.setSettings(message.newSettings)
                .then(() => { sendResponse(); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        }
        case "GetFeeds": {
            Application.getFeeds(message.source)
                .then((value) => { sendResponse(value); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        }
        case "AddFeed": {
            Application.addFeed(message.feedData)
                .then((result) => { sendResponse(result); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        }
        case "RemoveFeed": {
            Application.removeFeed(message.feedData)
                .then((result) => { sendResponse(result); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        }
        case "HasFeed": {
            Application.hasFeed(message.feedData)
                .then((value) => { sendResponse(value); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        }
        case "GetUnreadPosts": {
            Application.getUnreadPosts()
                .then((value) => { sendResponse(value); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        }
        case "ReadPosts": {
            Application.readPosts(message.open, message.id)
                .then(() => { sendResponse(); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        }
        case "Update": {
            Application.update()
                .then(() => { sendResponse(); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        }
        case "ImportFeeds":
            Application.importFeeds(message.combinedFeedsObject)
                .then(() => { sendResponse(); })
                .catch((reason) => { console.error(`Failed to ${message.type}: ${reason}.`); });
            break;
        default: {
            const unreachable: never = message;
            console.error(`Invalid message '${JSON.stringify(unreachable)}'.`);
            break;
        }
    }
    
    return true;
});
