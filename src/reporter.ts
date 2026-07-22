import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative } from "node:path";
import type { Reporter, TestModule } from "vitest/node";
import {
  createTimingStats,
  formatTimingStats,
  type FormatTimingStatsOptions,
  type TimedTest,
  type TimingStatsOptions,
} from "./timing-stats.js";

export type TimeStatsReporterOptions = TimingStatsOptions &
  Pick<FormatTimingStatsOptions, "histogramBins" | "histogramFillChar" | "histogramEmptyChar"> & {
    /** `text` is for terminals; `json` is a compact machine/agent-readable summary. */
    output?: "text" | "json";
    /** Write the report to a separate artifact rather than the shared reporter stream. */
    outputFile?: string;
  };

/**
 * An additive Vitest reporter: configure it alongside `default`, `verbose`,
 * `json`, JUnit, or any other reporter. It only observes completed test cases.
 */
export default class TimeStatsReporter implements Reporter {
  private readonly options: TimeStatsReporterOptions;
  private readonly projectRoot: string;

  constructor(options: TimeStatsReporterOptions = {}) {
    this.options = options;
    this.projectRoot = process.cwd();
  }

  onTestRunEnd(testModules: ReadonlyArray<TestModule>): void {
    const tests: TimedTest[] = [];

    for (const module of testModules) {
      for (const testCase of module.children.allTests()) {
        const diagnostic = testCase.diagnostic();
        if (!diagnostic) continue;
        const rawFile: string = module.relativeModuleId ?? module.moduleId;
        // Display the path relative to the project root so the slowest-tests list
        // doesn't flood the terminal with long absolute paths.
        const file = isAbsolute(rawFile) ? relative(this.projectRoot, rawFile) : rawFile;
        tests.push({
          name: testCase.fullName,
          file,
          durationMs: diagnostic.duration,
        });
      }
    }

    const stats = createTimingStats(tests, this.options);
    const output =
      this.options.output === "json"
        ? `${JSON.stringify({ schemaVersion: 1, kind: "vitest-time-stats", ...stats }, (_key, value) => (typeof value === "number" ? Math.round(value * 10) / 10 : value))}\n`
        : formatTimingStats(stats, {
            histogramBins: this.options.histogramBins,
            histogramFillChar: this.options.histogramFillChar,
            histogramEmptyChar: this.options.histogramEmptyChar,
            color: this.options.outputFile ? false : undefined,
          });

    if (this.options.outputFile) {
      mkdirSync(dirname(this.options.outputFile), { recursive: true });
      writeFileSync(this.options.outputFile, output);
      return;
    }

    process.stdout.write(output);
  }
}
