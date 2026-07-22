import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["fixture/**/*.test.ts"],
    reporters: [
      [
        "./src/reporter.ts",
        {
          binSizeMs: 10,
          histogramBins: "all",
          outputFile: "reports/time-stats.txt",
        },
      ],
    ],
  },
});
