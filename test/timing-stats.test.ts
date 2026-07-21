import { describe, expect, it } from "vitest";
import { createTimingStats, formatTimingStats } from "../src/timing-stats.js";

const fixture = [
  { name: "fast", file: "fixture.test.ts", durationMs: 10 },
  { name: "edge of first bin", file: "fixture.test.ts", durationMs: 99 },
  { name: "second bin", file: "fixture.test.ts", durationMs: 100 },
  { name: "slow", file: "fixture.test.ts", durationMs: 201 },
];

describe("createTimingStats", () => {
  it("creates deterministic bins, percentile values, and a slow-test concentration summary", () => {
    const stats = createTimingStats(fixture, {
      binSizeMs: 100,
      slowThresholdMs: 100,
      slowestTestsCount: 2,
    });

    expect(stats).toMatchObject({
      testCount: 4,
      totalExecutionMs: 410,
      minMs: 10,
      meanMs: 102.5,
      percentiles: { p50: 99, p90: 201, p99: 201, max: 201 },
      histogram: [
        { startMs: 0, endMs: 100, count: 2, percentage: 50 },
        { startMs: 100, endMs: 200, count: 1, percentage: 25 },
        { startMs: 200, endMs: 300, count: 1, percentage: 25 },
      ],
      slow: { thresholdMs: 100, count: 1, percentage: 25 },
    });
    expect(stats.slow.executionPercentage).toBeCloseTo(49.02, 2);
    expect(stats.slowest.map((test) => test.name)).toEqual(["slow", "second bin"]);
  });

  it("formats a concise terminal report", () => {
    const report = formatTimingStats(
      createTimingStats(fixture, {
        binSizeMs: 100,
        slowThresholdMs: 100,
        slowestTestsCount: 1,
      })
    );

    expect(report).toContain("Time Stats: 4 tests; 410ms total test execution");
    expect(report).toContain("0-100ms");
    expect(report).toContain("Percentiles: p50 99ms | p90 201ms | p99 201ms | max 201ms");
    expect(report).toContain("Slow tests: 1/4 over 100ms");
    expect(report).toContain("1.   201ms  fixture.test.ts > slow");
  });

  it("rejects invalid configuration and handles no completed tests", () => {
    expect(() => createTimingStats([], { binSizeMs: 0 })).toThrow(
      "binSizeMs must be greater than 0"
    );
    expect(() =>
      createTimingStats([{ name: "long", file: "fixture.test.ts", durationMs: 300_000 }], {
        binSizeMs: 1,
      })
    ).toThrow("binSizeMs would produce 300001 histogram bins");
    expect(formatTimingStats(createTimingStats([]))).toContain("no completed test cases");
  });
});
