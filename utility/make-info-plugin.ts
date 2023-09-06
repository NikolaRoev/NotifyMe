import { type PluginOption } from "vite";



type Info = {
    version: string,
    url: string
}


export default function makeInfoPlugin(info: Info): PluginOption {
    return {
        name: "make-info",
        transformIndexHtml(html, ctx) {
            // Options page.
            if (ctx.filename.endsWith("options.html")) {
                return html.replace(
                    /<a href="__URL__" target="_blank">__VERSION__<\/a>/,
                    `<a href="${info.url}" target="_blank">${info.version}</a>`
                );
            }
            else {
                return html;
            }
        }
    };
}
