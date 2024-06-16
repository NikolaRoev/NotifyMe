import { type LogMessage, Severity, addLog } from "../../src/log";
import { expect, suite, test } from "vitest";



suite.concurrent("Log", () => {
    test("Log is truncated", () => {
        const logMessage: LogMessage = {
            timestamp: 0,
            severity: Severity.INFO,
            message: ""
        };
        let log: LogMessage[] = [];
        for (let _ = 0; _ < 5_000; ++_) {
            log.push(logMessage);
        }

        log = addLog(log, Severity.INFO, "THIS");

        expect(log).toHaveLength(4_901);
        expect(log.at(-1)?.message).toEqual("THIS");
    });
});
