import { info } from "./log";



const ALARM_NAME = "NOTIFYME-ALARM";


export async function createAlarm(periodInMinutes: number) {
    await info(`Created alarm with an update period of ${periodInMinutes} minutes.`);
    return chrome.alarms.create(ALARM_NAME, { periodInMinutes });
}

export async function checkAlarm(periodInMinutes: number) {
    const alarm = await chrome.alarms.get(ALARM_NAME);
    // FIXME: Remove when Chrome types API is up to date with documentation.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!alarm || alarm.periodInMinutes !== periodInMinutes) {
        await createAlarm(periodInMinutes);
    }
}
