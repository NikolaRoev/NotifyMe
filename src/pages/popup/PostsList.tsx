import type { Message } from "../../message";
import type { Post } from "../../feeds/base-feeds-manager";
import clsx from "clsx";
import { formatDistanceToNowStrict } from "date-fns";



type PostItemProps = {
    post: Post,
    open: (id: string) => void,
    markRead: (id: string) => void
}

function PostItem({ post, open, markRead }: PostItemProps) {
    return (
        <div className="flex even:bg-neutral-100">
            <div
                className={clsx(
                    "p-[5px] flex flex-col grow",
                    "border-r-[1px] border-b-[1px] border-neutral-600",
                    "hover:bg-neutral-300 active:bg-neutral-400"
                )}
                onClick={() => { open(post.id); }}
            >
                <p className="m-[1px] text-[12px]">{post.source}</p>
                <p className="m-[1px] text-[12px] font-bold">{post.title}</p>
                <p className="m-[1px] text-[10px] italic self-end">{formatDistanceToNowStrict(post.created, { addSuffix: true })}</p>
            </div>
            <button
                className={clsx(
                    "min-w-[32px] flex items-center justify-center",
                    "border-b-[1px] border-neutral-600",
                    "hover:bg-neutral-400 active:bg-neutral-500"
                )}
                onClick={() => { markRead(post.id); }}
                title="Mark Read"
            ><img src="/icons/check.svg" /></button>
        </div>
    );
}


export default function PostsList({ posts, getPosts }: { posts: Post[], getPosts: () => void }) {
    function open(id: string) {
        const message: Message = { type: "ReadPosts", open: true, id: id };
        chrome.runtime.sendMessage(message)
            .then(() => { getPosts(); })
            .catch((reason: unknown) => { console.error(`Failed to open post: ${reason}.`); });
    }

    function markRead(id: string) {
        const message: Message = { type: "ReadPosts", open: false, id: id };
        chrome.runtime.sendMessage(message)
            .then(() => { getPosts(); })
            .catch((reason: unknown) => { console.error(`Failed to mark post as read: ${reason}.`); });
    }
    

    const postItems = posts.map((post) =>
        <PostItem key={post.id} post={post} open={open} markRead={markRead} />
    );

    return (
        <div className="relative flex flex-col grow overflow-y-auto border-[1px] border-neutral-600">
            {
                postItems.length ?
                    postItems :
                    <p className="absolute top-1/2 left-1/2 text-lg -translate-x-1/2 -translate-y-1/2">No unread posts</p>
            }
        </div>
    );
}
