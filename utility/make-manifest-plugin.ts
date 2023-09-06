import { type PluginOption } from "vite";
import { resolve } from "path";
import { writeFileSync } from "fs";



export type Manifest = {
    "manifest_version": number,
    "name": string,
    "version": string,

    "action"?: {
        "default_icon"?: { [Key in "16" | "24" | "32"]?: string },
        "default_title"?: string,
        "default_popup"?: string
    },
    "default_locale"?: "en"
    "description"?: string,
    "icons"?: { [Key in "16" | "32" | "48" | "128"]?: string },

    "author"?: string | { "email": string },
    "background"?: {
        "service_worker"?: string,
        "scripts"?: string[],
        "type"?: "module"
    },
    "options_ui"?: {
        "page": string,
        "open_in_tab": boolean
    }
    "host_permissions"?: string[]
    "key"?: string,
    "permissions"?: string[],

    "browser_specific_settings"?: {
        "gecko": {
            "id": string,
            "strict_min_version"?: string
        }
    }
}


export default function makeManifestPlugin(manifest: Manifest, mode: string): PluginOption {
    return {
        name: "make-manifest",
        writeBundle(options) {
            if (options.dir === undefined) {
                throw new Error("Missing output directory.");
            }

            const manifestPath = resolve(options.dir, "manifest.json");
            if (mode === "chrome") {
                delete manifest.background?.scripts;
                delete manifest.browser_specific_settings;
            }
            else {
                delete manifest.background?.service_worker;
                delete manifest.key;
            }

            writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
            this.info(`Made manifest file for ${mode}.`);
        }
    };
}
