import * as Storage from "./storage";



export enum Severity {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}

export type LogMessage = {
    timestamp: number,
    severity: Severity,
    message: string
}


export function addLog(log: LogMessage[], severity: Severity, message: string) {
    const MAX_LOG_SIZE = 5_000;
    const LOG_REDUCTION_SIZE = 100;

    const timestamp = Date.now();
    log.push({ timestamp, severity, message });

    if (log.length > MAX_LOG_SIZE) {
        log = log.slice(LOG_REDUCTION_SIZE);
    }

    return log;
}

async function log(severity: Severity, message: string) {
    let log = await Storage.get(Storage.GenericKey.Log, []);
    log = addLog(log, severity, message);
    await Storage.set(Storage.GenericKey.Log, log);
}

export function info(message: string) {
    console.log(message);
    log(Severity.INFO, message).catch((reason) => {
        console.error(`Failed to store info log: ${reason}.`);
    });
}

export function warn(message: string) {
    console.warn(message);
    log(Severity.WARN, message).catch((reason) => {
        console.error(`Failed to store warn log: ${reason}.`);
    });
}

export function error(message: string) {
    console.error(message);
    log(Severity.ERROR, message).catch((reason) => {
        console.error(`Failed to store error log: ${reason}.`);
    });
}

export function getLog() {
    return Storage.get(Storage.GenericKey.Log, []);
}
