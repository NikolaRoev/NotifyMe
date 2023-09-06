/**
 * @param ms Amount to wait for in milliseconds.
 * @returns A promise that should be awaited.
 */
export function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
