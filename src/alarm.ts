const ALARM_NAME = "NOTIFYME-ALARM";


export function createAlarm(periodInMinutes: number) {
    return chrome.alarms.create(ALARM_NAME, { periodInMinutes });
}

export async function checkAlarm(periodInMinutes: number) {
    const alarm = await chrome.alarms.get(ALARM_NAME);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!alarm || alarm.periodInMinutes !== periodInMinutes) {
        await createAlarm(periodInMinutes);
    }
}
