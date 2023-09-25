/* eslint-disable camelcase */
import { promises as fs } from "fs";

export async function createRelease({ github, context }, version) {
    await github.rest.git.createRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: `refs/tags/${version}`,
        sha: context.sha
    });
    
    const { data } = await github.rest.repos.createRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag_name: `${version}`
    });
    
    await github.rest.repos.uploadReleaseAsset({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: data.id,
        name: `notifyme-chrome-${version}.zip`,
        data: await fs.readFile("extension-chrome.zip")
    });

    await github.rest.repos.uploadReleaseAsset({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: data.id,
        name: `notifyme-firefox-${version}.zip`,
        data: await fs.readFile("extension-firefox.zip")
    });
}
