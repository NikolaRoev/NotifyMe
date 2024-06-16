import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { FeedSource, type Feeds } from "../../feeds/base-feeds-manager";
import { type Settings, defaultSettings } from "../../settings";
import GeneralButton from "./GeneralButton";
import Input from "./Input";
import type { Message } from "../../message";



function exportFeeds() {
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
    createExportFile().catch((reason: unknown) => {
        if ((reason as Error).name !== "AbortError") {
            const message = `Failed to export feeds: ${reason}.`;
            console.error(message);
            alert(message);
        }
    });
}

function importFeeds() {
    const readImportFile = async () => {
        let contents;

        if (typeof window.showOpenFilePicker !== "undefined") {
            const [handle] = await showOpenFilePicker({
                types: [{
                    description: "JSON Files",
                    accept: { "application/json": [".json"] }
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

    readImportFile().catch((reason: unknown) => {
        if ((reason as Error).name !== "AbortError") {
            const message = `Failed to import feeds: ${reason}.`;
            console.error(message);
            alert(message);
        }
    });
}



function useSettings() {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
  
    const getSettings = () => {
        const message: Message = { type: "GetSettings" };
        chrome.runtime.sendMessage(message).then((settings: Settings) => {
            setSettings({...settings, updatePeriod: settings.updatePeriod});
        }).catch((reason: unknown) => { console.error(`Failed to get settings for options: ${reason}.`); });
    };

    useEffect(() => {
        getSettings();
    }, []);
  
    return { settings, getSettings, setSettings };
}


export default function SettingsTab() {
    const { settings, getSettings, setSettings } = useSettings();


    function handleUpdatePeriodInput(event: ChangeEvent<HTMLInputElement>) {
        setSettings({...settings, updatePeriod: event.target.valueAsNumber});
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const message: Message = { type: "SetSettings", newSettings: settings };
        chrome.runtime.sendMessage(message)
            .then(() => { getSettings(); })
            .catch((reason: unknown) => { console.error(`Failed to set settings from options: ${reason}.`); });
    }


    return (
        <>
            <form className="gap-y-[15px] flex flex-col" onSubmit={handleSubmit}>
                <div className="relative flex gap-x-[10px] items-center">
                    <label htmlFor="update-period-input" className="text-[14px]">Update Period:</label>
                    <Input
                        id="update-period-input"
                        type="number"
                        min="0"
                        step="any"
                        value={settings.updatePeriod}
                        onInput={handleUpdatePeriodInput}
                    />
                    <span className="absolute right-[30px]">min</span>
                </div>
                <div className="flex justify-end">
                    <GeneralButton>Apply</GeneralButton>
                </div>
            </form>

            <div className="flex grow gap-x-[5px]">
                <GeneralButton onClick={exportFeeds} className="self-end">Export Feeds</GeneralButton>
                <GeneralButton onClick={importFeeds} className="self-end">Import Feeds</GeneralButton>
                <a
                    className="ml-auto self-end underline"
                    href="https://github.com/NikolaRoev/NotifyMe"
                    target="_blank"
                    rel="noreferrer"
                >{__VERSION__}</a>
            </div>
        </>
    );
}
