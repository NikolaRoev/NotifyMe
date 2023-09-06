import { BaseFeedsManager, type Post } from "../../src/feeds/base-feeds-manager";
import { expect, suite, test } from "vitest";



const post0: Post = {
    id: "id0",
    title: "title0",
    url: "url0",
    source: "source0",
    created: 0
};

const post1: Post = {
    id: "id1",
    title: "title1",
    url: "url1",
    source: "source1",
    created: 1
};


suite("Posts", () => {
    test("Can read a post", () => {
        const posts: Post[] = [post0, post1];

        expect(BaseFeedsManager.readPosts(posts, post0.id)).toEqual([post0]);
        expect(posts).toEqual([post1]);
    });

    test("Can read all posts", () => {
        const posts: Post[] = [post0, post1];

        expect(BaseFeedsManager.readPosts(posts)).toEqual([post0, post1]);
        expect(posts).toEqual([]);
    });

    test("Can catch missing id", () => {
        const posts: Post[] = [post0];

        expect(() => BaseFeedsManager.readPosts(posts, "wrongId")).toThrow("Missing post 'wrongId'");
        expect(posts).toEqual([post0]);
    });
});
