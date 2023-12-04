import type { Manifest } from "./utility/make-manifest-plugin";



export const manifest: Manifest = {
    "manifest_version": 3,
    "name": "NotifyMe",
    "version": "1.0.2",

    "action": {
        "default_popup": "popup.html"
    },
    "description": "Notifies you of new posts.",
    "icons": {
        "16": "/icons/icon-16.png",
        "32": "/icons/icon-32.png",
        "48": "/icons/icon-48.png",
        "128": "/icons/icon-128.png"
    },

    "author": "nikola.roev@gmail.com",
    "background": {
        "service_worker": "service-worker.js",
        "scripts": ["service-worker.js"],
        "type": "module"
    },
    "options_ui": {
        "page": "options.html",
        "open_in_tab": true
    },
    "host_permissions": ["*://*/*"],
    "key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAitqBcNWmJh6OOvyo/yV7XDivPmcnfHK5uOOKBXZpDw1hNIxL9PdQMoLn2e/9A4KpWecj76Ac4KKfOlev98K7CeMIj4SJs1pgtQ0WoiLC40OQNy1EHaMKwFlM4O5l/NL2Tie38T/G2ZaX2ekQHkUGTLg2WcIFvycXwa7bwu5mhM3mft3oCYjKDy2BafGkjDtfzjQgmjiUf+UHUxP6AMOs8ZVRNloX29pQkq+dSe6jljrx3fWojEJgeGc7Oezg8mRp5O3sgerZSzAaMELW10tQ3I+AQywn26R5L2ZyV7y8sYBr6dvlYBrZgFr2hFfUlqsMDWbFa7jT1LMtYe1jvdhAdwIDAQAB",
    "permissions": [
        "alarms",
        "notifications",
        "storage",
        "unlimitedStorage"
    ],
    
    "browser_specific_settings": {
        "gecko": {
            "id": "nikola.roev@notifyme",
            "strict_min_version": "112.0"
        }
    }
};
