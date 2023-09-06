export type RSSTextData = {
    rss: {
        $: { version: string }
        channel : {
            title: string,
            link: string,
            description: string,
            language: string,
            generator: string,
            item: unknown[]
        }
    }
}

export function getDefaultTextData(): RSSTextData {
    return {
        rss: {
            $: { version: "2.0" },
            channel : {
                title: "testChannelTitle",
                link: "testChannelLink",
                description: "testChannelDescription",
                language: "testChannelLanguage",
                generator: "testChannelGenerator",
                item: []
            }
        }
    };
}

export const post0 = {
    title: "Title 0",
    link: "about:blank",
    description: "Description0",
    guid: { $: { isPermaLink: false }, _: "0000000" },
    pubDate: "Mon, 21 Aug 2023 00:30:00 GMT"
};

export const post1 = {
    title: "Title 1",
    link: "about:blank",
    description: "Description1",
    guid: { $: { isPermaLink: false }, _: "0000001" },
    pubDate: "Mon, 21 Aug 2023 01:30:00 GMT"
};

export const post2 = {
    title: "Title 2",
    link: "about:blank",
    description: "Description2",
    guid: { $: { isPermaLink: false }, _: "0000002" },
    pubDate: "Mon, 21 Aug 2023 02:30:00 GMT"
};
