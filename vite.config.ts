import { defineConfig } from "vite";
import makeInfoPlugin from "./utility/make-info-plugin";
import makeManifestPlugin from "./utility/make-manifest-plugin";
import { manifest } from "./manifest";
import { resolve } from "path";



export default defineConfig(({ mode }) => ({
    envDir: __dirname,
    plugins: [
        makeManifestPlugin(manifest, mode),
        makeInfoPlugin({
            version: manifest.version,
            url: "https://github.com/NikolaRoev/NotifyMe"
        })
    ],
    define: {
        "__UPDATE_PERIOD__": process.env.NOTIFYME_TESTING ? 0 : 15
    },
    root: resolve(__dirname, "src", "pages"),
    publicDir: resolve(__dirname, "public"),
    build: {
        emptyOutDir: true,
        sourcemap: "inline",
        rollupOptions: {
            input: {
                "service-worker": resolve(__dirname, "src", "service-worker.ts"),
                "popup": resolve(__dirname, "src", "pages", "popup.html"),
                "options": resolve(__dirname, "src", "pages", "options.html")
            },
            output: {
                dir: resolve(__dirname, "dist", mode),
                entryFileNames: "[name].js"
            }
        }
    }
}));
