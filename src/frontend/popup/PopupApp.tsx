import { useEffect, useState } from "react";
import type { Message } from "../../backend/message";
import type { Post } from "../../backend/feeds/base-feeds-manager";
import PostsList from "./PostsList";
import ToolBar from "./ToolBar";



function usePosts() {
    const [posts, setPosts] = useState<Post[]>([]);
  
    const getPosts = () => {
        const message: Message = { type: "GetUnreadPosts" };
        chrome.runtime.sendMessage(message).then((posts: Post[]) => {
            setPosts(posts);
        }).catch((reason: unknown) => { console.error(`Failed to get posts in popup: ${reason}.`); });
    };

    useEffect(() => {
        getPosts();
    }, []);
  
    return { posts, getPosts };
}


export default function PopupApp() {
    const { posts, getPosts } = usePosts();

    return (
        <>
            <ToolBar getPosts={getPosts}/>
            <PostsList posts={posts} getPosts={getPosts}/>
        </>
    );
}
