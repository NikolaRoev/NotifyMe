import ConfirmButton from "../../components/ConfirmButton";
import { FeedSource } from "../../../backend/feeds/base-feeds-manager";
import FeedsList from "../components/FeedsList";
import type { KemonoFeeds } from "../../../backend/feeds/kemono-feeds-manager";
import type { Message } from "../../../backend/message";
import type { Result } from "../../../../utility/result";
import { Virtuoso } from "react-virtuoso";
import clsx from "clsx";



export default function KemonoFeedsList({ kemonoFeeds, getKemonoFeeds }: { kemonoFeeds: KemonoFeeds, getKemonoFeeds: () => void }) {
    function removeCreator(service: string, id: string) {
        const message: Message = {
            type: "RemoveFeed",
            feedData: {
                source: FeedSource.Kemono,
                service: service,
                id: id
            }
        };
        chrome.runtime.sendMessage(message).then((result: Result<boolean>) => {
            if (!result.ok) {
                alert(`Failed to remove ${id}(${service}): ${result.error}.`);
            }
            getKemonoFeeds();
        }).catch((reason: unknown) => { console.error(`Failed to remove Kemono feed: ${reason}.`); });
    }


    return (
        <FeedsList
            data={(filter) => {
                const filteredCreators = kemonoFeeds.creators.filter(
                    (creator) => creator.name.toLowerCase().includes(filter.toLowerCase())
                );

                return <Virtuoso
                    data={filteredCreators}
                    computeItemKey={(_, creator) => creator.service + creator.id }
                    itemContent={(index, creator) => (
                        <div className={clsx("flex", {"bg-neutral-100": index % 2})}>
                            <a
                                className="grow p-[5px] text-[16px] flex items-center hover:underline"
                                href={`https://kemono.cr/${creator.service}/user/${creator.id}`}
                                target="_blank" rel="noreferrer"
                            >{creator.name}</a>
                            <ConfirmButton
                                initialSrc={"/icons/trash.svg"}
                                confirmSrc={"/icons/x-circle.svg"}
                                onClick={() => { removeCreator(creator.service, creator.id); }}
                                title={`Remove ${creator.name}`}
                            />
                        </div>
                    )}
                />;
            }}
        />
    );
}
