import type { Message } from "../../message";
import clsx from "clsx";



type ToolButtonProps = {
    onClick: React.MouseEventHandler,
    title: string,
    imageSrc: string
}

function ToolButton({ onClick, title, imageSrc }: ToolButtonProps) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={clsx(
                "w-[32px] h-[32px]",
                "flex items-center justify-center",
                "border-none rounded-[5px]",
                "hover:bg-neutral-300 active:bg-neutral-400"
            )}
        ><img src={imageSrc} /></button>
    );
}


export default function ToolBar({ getPosts }: { getPosts: () => void }) {
    function openOptions() {
        chrome.runtime.openOptionsPage()
            .catch((reason) => { console.error(`Failed to open options page: ${reason}.`); });
    }

    function update() {
        const message: Message = { type: "Update" };
        chrome.runtime.sendMessage(message)
            .then(() => { getPosts(); })
            .catch((reason) => { console.error(`Failed to update from popup: ${reason}.`); });
    }

    function openAll() {
        const message: Message = { type: "ReadPosts", open: true };
        chrome.runtime.sendMessage(message)
            .then(() => { getPosts(); })
            .catch((reason) => { console.error(`Failed to open all posts: ${reason}.`); });
    }

    function markAllRead() {
        const message: Message = { type: "ReadPosts", open: false };
        chrome.runtime.sendMessage(message)
            .then(() => { getPosts(); })
            .catch((reason) => { console.error(`Failed to mark all posts as read: ${reason}.`); });
    }


    return (
        <div className="flex justify-around p-[3px] border-[1px] border-solid border-neutral-600 border-b-0">
            <ToolButton onClick={openOptions} title="Options" imageSrc="/icons/gear.svg"/>
            <ToolButton onClick={update} title="Update" imageSrc="/icons/arrow-clockwise.svg"/>
            <ToolButton onClick={openAll} title="Open All" imageSrc="/icons/box-arrow-up-right.svg"/>
            <ToolButton onClick={markAllRead} title="Mark All Read" imageSrc="/icons/check-all.svg"/>
        </div>
    );
}
