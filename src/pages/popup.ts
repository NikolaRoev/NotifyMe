import type { Message } from "../message";
import type { Post } from "../feeds/base-feeds-manager";
import { relativeTime } from "../../utility/relative-time";



const optionsButton = document.getElementById("options-button") as HTMLButtonElement;
const updateButton = document.getElementById("update-button") as HTMLButtonElement;
const openAllButton = document.getElementById("open-all-button") as HTMLButtonElement;
const markAllReadButton = document.getElementById("mark-all-read-button") as HTMLButtonElement;
const postsList = document.getElementById("posts-list") as HTMLDivElement;


function updatePostsList() {
    const message: Message = { type: "GetUnreadPosts" };
    chrome.runtime.sendMessage(message).then((posts: Post[]) => {
        if (posts.length === 0) {
            postsList.innerHTML = "<p class=\"no-posts-label\">No unread posts</p>";
        }
        else {
            postsList.innerHTML = "";
            for (const post of posts) {
                const postElement = document.createElement("div");
                postElement.classList.add("post");
    
                const info = document.createElement("div");
                info.innerHTML = `<p>${post.source}</p>
                                  <p>${post.title}</p>
                                  <p>${relativeTime(post.created)}</p>`;
                info.addEventListener("click", () => {
                    const message: Message = { type: "ReadPosts", open: true, id: post.id };
                    chrome.runtime.sendMessage(message)
                        .then(() => { updatePostsList(); })
                        .catch((reason) => { console.error(`Failed to open post: ${reason}.`); });
                });
                postElement.appendChild(info);
    
                const button = document.createElement("button");
                button.type = "button";
                button.title = "Mark Read";
                button.innerHTML = "<img src=\"/icons/check.svg\">";
                button.addEventListener("click", () => {
                    const message: Message = { type: "ReadPosts", open: false, id: post.id };
                    chrome.runtime.sendMessage(message)
                        .then(() => { updatePostsList(); })
                        .catch((reason) => { console.error(`Failed to mark post as read: ${reason}.`); });
                    
                });
                postElement.appendChild(button);
    
                postsList.appendChild(postElement);
            }
        }
    }).catch((reason) => { console.error(`Failed to update posts in popup: ${reason}.`); });
}


optionsButton.addEventListener("click", () => { chrome.runtime.openOptionsPage(); });

updateButton.addEventListener("click", () => {
    const message: Message = { type: "Update" };
    chrome.runtime.sendMessage(message)
        .then(() => { updatePostsList(); })
        .catch((reason) => { console.error(`Failed to update from popup: ${reason}.`); });
});

openAllButton.addEventListener("click", () => {
    const message: Message = { type: "ReadPosts", open: true };
    chrome.runtime.sendMessage(message)
        .then(() => { updatePostsList(); })
        .catch((reason) => { console.error(`Failed to open all posts: ${reason}.`); });
});

markAllReadButton.addEventListener("click", () => {
    const message: Message = { type: "ReadPosts", open: false };
    chrome.runtime.sendMessage(message)
        .then(() => { updatePostsList(); })
        .catch((reason) => { console.error(`Failed to mark all posts as read: ${reason}.`); });
});


updatePostsList();
