import { expect, suite, test } from "vitest";
import { relativeTime } from "../../utility/relative-time";
import { wait } from "../../utility/wait";



suite.concurrent("Wait", () => {
    test("Waits for expected amount of time", async () => {
        const waitTime = 1000;

        const start = performance.now();
        await wait(waitTime);
        const end = performance.now();
        const elapsed = end - start;

        // With some tolerance.
        expect(elapsed).toBeGreaterThan(waitTime * 0.90);
        expect(elapsed).toBeLessThan(waitTime * 1.10);
    });
});


suite.concurrent("Relative time", () => {
    const millisecondsInMinute = 60 * 1000;
    const millisecondsInHour = 3_600 * 1000;
    const millisecondsInDay = 86_400 * 1000;
    const millisecondInWeek = 604_800 * 1000;

    
    test("Correctly formats times in the past", () => {
        expect(relativeTime(0, 0)).toEqual("now");

        expect(relativeTime(-(millisecondsInMinute - 1000), 0)).toEqual("59 seconds ago");
        expect(relativeTime(-(millisecondsInMinute), 0)).toEqual("1 minute ago");
        expect(relativeTime(-(millisecondsInMinute + 1000), 0)).toEqual("1 minute ago");

        expect(relativeTime(-(millisecondsInHour - 1000), 0)).toEqual("59 minutes ago");
        expect(relativeTime(-(millisecondsInHour), 0)).toEqual("1 hour ago");
        expect(relativeTime(-(millisecondsInHour + 1000), 0)).toEqual("1 hour ago");

        expect(relativeTime(-(millisecondsInDay - 1000), 0)).toEqual("23 hours ago");
        expect(relativeTime(-(millisecondsInDay), 0)).toEqual("yesterday");
        expect(relativeTime(-(millisecondsInDay + 1000), 0)).toEqual("yesterday");

        expect(relativeTime(-(millisecondInWeek - 1000), 0)).toEqual("6 days ago");
        expect(relativeTime(-(millisecondInWeek), 0)).toEqual("last week");
        expect(relativeTime(-(millisecondInWeek + 1000), 0)).toEqual("last week");
        expect(relativeTime(-millisecondInWeek, millisecondInWeek)).toEqual("2 weeks ago");
    });

    test("Correctly formats times in the future", () => {
        expect(relativeTime(0, 0)).toEqual("now");

        expect(relativeTime(millisecondsInMinute - 1000, 0)).toEqual("in 59 seconds");
        expect(relativeTime(millisecondsInMinute, 0)).toEqual("in 1 minute");
        expect(relativeTime(millisecondsInMinute + 1000, 0)).toEqual("in 1 minute");

        expect(relativeTime(millisecondsInHour - 1000, 0)).toEqual("in 59 minutes");
        expect(relativeTime(millisecondsInHour, 0)).toEqual("in 1 hour");
        expect(relativeTime(millisecondsInHour + 1000, 0)).toEqual("in 1 hour");

        expect(relativeTime(millisecondsInDay - 1000, 0)).toEqual("in 23 hours");
        expect(relativeTime(millisecondsInDay, 0)).toEqual("tomorrow");
        expect(relativeTime(millisecondsInDay + 1000, 0)).toEqual("tomorrow");

        expect(relativeTime(millisecondInWeek - 1000, 0)).toEqual("in 6 days");
        expect(relativeTime(millisecondInWeek, 0)).toEqual("next week");
        expect(relativeTime(millisecondInWeek + 1000, 0)).toEqual("next week");
        expect(relativeTime(millisecondInWeek, -millisecondInWeek)).toEqual("in 2 weeks");
    });
});
