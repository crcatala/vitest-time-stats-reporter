import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["fixture/**/*.test.ts"],
    reporters: [
      "default",
      [
        "./src/reporter.ts",
        {
          binSizeMs: 75,
          slowThresholdMs: 175,
          slowestTestsCount: 3,
        },
      ],
    ],
  },
});
