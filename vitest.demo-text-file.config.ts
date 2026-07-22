import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["fixture/**/*.test.ts"],
    reporters: [
      [
        "./src/reporter.ts",
        {
          outputFile: "reports/time-stats.txt",
        },
      ],
    ],
  },
});
