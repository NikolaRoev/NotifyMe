/* eslint-disable camelcase */
import { Octokit } from "@octokit/rest";
import { promises as fs } from "fs";
import { manifest } from "../manifest";



const CHANGELOG = await fs.readFile(`./changelog/${manifest.version}.md`, { encoding: "utf8" });
const OWNER = process.env.GITHUB_REPOSITORY_OWNER;
const REPO = process.env.GITHUB_REPOSITORY?.split("/").at(1);
const SHA = process.env.GITHUB_SHA;

if (!OWNER || !REPO || !SHA) {
    throw new Error("Missing environment variable.");
}


const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

await octokit.rest.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: `refs/tags/${manifest.version}`,
    sha: SHA
});

const { data } = await octokit.rest.repos.createRelease({
    owner: OWNER,
    repo: REPO,
    tag_name: manifest.version,
    body: CHANGELOG
});

await octokit.rest.repos.uploadReleaseAsset({
    owner: OWNER,
    repo: REPO,
    release_id: data.id,
    name: `notifyme-chrome-${manifest.version}.zip`,
    data: await fs.readFile("extension-chrome.zip") as unknown as string
});

await octokit.rest.repos.uploadReleaseAsset({
    owner: OWNER,
    repo: REPO,
    release_id: data.id,
    name: `notifyme-firefox-${manifest.version}.zip`,
    data: await fs.readFile("extension-firefox.zip") as unknown as string
});
