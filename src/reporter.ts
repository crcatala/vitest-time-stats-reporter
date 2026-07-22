import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Reporter, TestModule } from "vitest/node";
import {
  createTimingStats,
  formatTimingStats,
  type TimedTest,
  type TimingStatsOptions,
} from "./timing-stats.js";

export type TimeStatsReporterOptions = TimingStatsOptions & {
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

  constructor(options: TimeStatsReporterOptions = {}) {
    this.options = options;
  }

  onTestRunEnd(testModules: ReadonlyArray<TestModule>): void {
    const tests: TimedTest[] = [];

    for (const module of testModules) {
      for (const testCase of module.children.allTests()) {
        const diagnostic = testCase.diagnostic();
        if (!diagnostic) continue;
        tests.push({
          name: testCase.fullName,
          file: module.relativeModuleId ?? module.moduleId,
          durationMs: diagnostic.duration,
        });
      }
    }

    const stats = createTimingStats(tests, this.options);
    const output =
      this.options.output === "json"
        ? `${JSON.stringify({ schemaVersion: 1, kind: "vitest-time-stats", ...stats }, (_key, value) => (typeof value === "number" ? Math.round(value * 10) / 10 : value))}\n`
        : formatTimingStats(stats);

    if (this.options.outputFile) {
      mkdirSync(dirname(this.options.outputFile), { recursive: true });
      writeFileSync(this.options.outputFile, output);
      return;
    }

    process.stdout.write(output);
  }
}
