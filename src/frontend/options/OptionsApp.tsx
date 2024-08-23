import { Tab, Tabs } from "../components/Tabs";
import KemonoTab from "./kemono-tab/KemonoTab";
import LogTab from "./log-tab/LogTab";
import RSSTab from "./rss-tab/RSSTab";
import RedditTab from "./reddit-tab/RedditTab";
import SettingsTab from "./settings-tab/SettingsTab";



export default function OptionsApp() {
    return (
        <>
            <div className="p-[20px] flex items-center gap-x-4 select-none">
                <img className="w-[80px] h-[80px]" src="/icons/icon.svg" />
                <h1 className="text-5xl font-bold">NotifyMe</h1>
            </div>
            <Tabs>
                <Tab title="Reddit"><RedditTab /></Tab>
                <Tab title="RSS"><RSSTab /></Tab>
                <Tab title="Kemono"><KemonoTab /></Tab>
                <Tab title="Settings"><SettingsTab /></Tab>
                <Tab title="Log"><LogTab /></Tab>
            </Tabs>
        </>
    );
}
