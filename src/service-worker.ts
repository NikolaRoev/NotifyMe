import * as Application from "./application";
import type { Message } from "./message";
import { checkAlarm } from "./alarm";
import { error } from "./log";



Application.getSettings()
    .then(async (settings) => { await checkAlarm(settings.updatePeriod); })
    .catch(async (reason: unknown) => { await error(`Failed to check alarm: ${reason}.`); });


chrome.alarms.onAlarm.addListener(() => {
    Application.update()
        .catch(async (reason: unknown) => { await error(`Failed to update on alarm: ${reason}.`); });
});

chrome.notifications.onClicked.addListener((notificationId) => {
    Application.readPosts(true, notificationId)
        .catch(async (reason: unknown) => { await error(`Failed to read post(s) on click: ${reason}.`); });
});

chrome.notifications.onButtonClicked.addListener((notificationId) => {
    Application.readPosts(false, notificationId)
        .catch(async (reason: unknown) => { await error(`Failed to read post(s) on button click: ${reason}.`); });
});

chrome.runtime.onMessage.addListener((message : Message, _, sendResponse) => {
    Application.handleMessage(message, sendResponse)
        .catch(async (reason: unknown) => { await error(`Failed to handle message: ${reason}.`); });
    
    return true;
});
