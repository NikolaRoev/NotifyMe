import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        dir: "./test/unit/",
        coverage: {
            all: true,
            include: ["src/**/*", "utility/**/*"],
            reporter: "text"
        }
    }
});
