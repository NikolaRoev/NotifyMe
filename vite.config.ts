import { defineConfig } from "vite";
import makeManifestPlugin from "./utility/make-manifest-plugin";
import { manifest } from "./manifest";
import react from "@vitejs/plugin-react";
import { resolve } from "path";



export default defineConfig(({ mode }) => ({
    envDir: __dirname,
    plugins: [
        react(),
        makeManifestPlugin(manifest, mode)
    ],
    define: {
        __VERSION__: JSON.stringify(manifest.version),
        __UPDATE_PERIOD__: process.env.NOTIFYME_TESTING ? 0 : 15
    },
    root: resolve(__dirname, "src", "frontend"),
    publicDir: resolve(__dirname, "public"),
    build: {
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                "service-worker": resolve(__dirname, "src", "backend", "service-worker.ts"),
                "popup": resolve(__dirname, "src", "frontend", "popup.html"),
                "options": resolve(__dirname, "src", "frontend", "options.html")
            },
            output: {
                dir: resolve(__dirname, "dist", mode),
                entryFileNames: "[name].js"
            }
        }
    }
}));
