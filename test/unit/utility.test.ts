import { expect, suite, test } from "vitest";
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
