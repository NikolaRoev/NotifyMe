import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { FeedSource } from "../../../backend/feeds/base-feeds-manager";
import GeneralButton from "../../components/GeneralButton";
import Input from "../../components/Input";
import type { KemonoFeeds } from "../../../backend/feeds/kemono-feeds-manager";
import KemonoFeedsList from "./KemonoFeedsList";
import type { Message } from "../../../backend/message";
import type { Result } from "../../../../utility/result";



function useKemonoFeeds() {
    const [kemonoFeeds, setKemonoFeeds] = useState<KemonoFeeds>({ creators: [] });
  
    const getKemonoFeeds = () => {
        const message: Message = { type: "GetFeeds", source: FeedSource.Kemono };
        chrome.runtime.sendMessage(message).then((feeds: KemonoFeeds) => {
            setKemonoFeeds(feeds);
        }).catch((reason: unknown) => { console.error(`Failed to update Kemono feeds: ${reason}.`); });
    };

    useEffect(() => {
        getKemonoFeeds();
    }, []);
  
    return { kemonoFeeds, getKemonoFeeds };
}


export default function KemonoTab() {
    const { kemonoFeeds, getKemonoFeeds } = useKemonoFeeds();
    const [inputs, setInputs] = useState<{ service: string, id: string }>({ service: "", id: "" });
    const userInputRef = useRef<HTMLInputElement>(null);

    
    useEffect(() => {
        const message: Message = {
            type: "HasFeed",
            feedData: {
                source: FeedSource.Kemono,
                service: inputs.service,
                id: inputs.id
            }
        };
        chrome.runtime.sendMessage(message).then((value: boolean) => {
            userInputRef.current?.setCustomValidity(value ? "Feed already added" : "");
        }).catch((reason: unknown) => { console.error(`Failed to validate Kemono form: ${reason}.`); });
    }, [inputs]);


    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const message: Message = {
            type: "AddFeed",
            feedData: {
                source: FeedSource.Kemono,
                service: inputs.service,
                id: inputs.id
            }
        };
        chrome.runtime.sendMessage(message).then((result: Result<boolean>) => {
            if (result.ok) {
                getKemonoFeeds();
                setInputs({ service: "", id: "" });
            }
            else {
                alert(result.error);
            }
        }).catch((reason: unknown) => { console.error(`Failed to add Kemono feed from options: ${reason}.`); });
    }

    
    return (
        <>
            <form className="flex gap-x-[10px] items-center" onSubmit={handleSubmit}>
                <label htmlFor="service-select" className="text-[14px]">Service:</label>
                <Input
                    id="service-select"
                    value={inputs.service}
                    onInput={(event: ChangeEvent<HTMLInputElement>) => { setInputs({...inputs, service: event.target.value}); }}
                />
                <label htmlFor="id-input" className="text-[14px]">Id:</label>
                <Input
                    id="id-input"
                    ref={userInputRef}
                    value={inputs.id}
                    onInput={(event: ChangeEvent<HTMLInputElement>) => { setInputs({...inputs, id: event.target.value}); }}
                />
                <GeneralButton>Add</GeneralButton>
            </form>
            
            <KemonoFeedsList kemonoFeeds={kemonoFeeds} getKemonoFeeds={getKemonoFeeds} />
        </>
    );
}
