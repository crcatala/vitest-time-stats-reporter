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
      }),
      { color: false }
    );

    expect(report).toContain("Time Stats: 4 tests; 410ms total test execution (1 slow)");
    expect(report).toContain("0-100ms");
    expect(report).toContain(
      ["Percentiles:", "  p50   99ms", "  p90  201ms", "  p99  201ms", "  max  201ms"].join("\n")
    );
    expect(report).toContain("Slow tests: 1/4 over 100ms");
    expect(report).toContain("Execution time split:");
    expect(report).toContain("slow (25% of tests)");
    expect(report).toContain("49% of time");
    expect(report).toContain("Slowest tests' share of total execution:");
    expect(report).toContain(
      "1.   201ms  ███████████████···············    49%  fixture.test.ts > slow"
    );
    expect(report).toContain("\n\nDuration distribution:");
    expect(report).toContain("\n\nPercentiles:");
    expect(report).toContain("\n\nExecution time split:");
    expect(report).toContain("\n\nSlowest tests' share of total execution:");
  });

  it("collapses runs of empty histogram bins by default and can show every bin", () => {
    const stats = createTimingStats(
      [
        { name: "fast", file: "fixture.test.ts", durationMs: 10 },
        { name: "slow", file: "fixture.test.ts", durationMs: 500 },
      ],
      { binSizeMs: 100 }
    );

    const collapsed = formatTimingStats(stats, { color: false });
    expect(collapsed).toContain("100-500ms");
    expect(collapsed).toContain("(4 empty bins)");
    expect(collapsed).not.toContain("100-200ms");

    const allBins = formatTimingStats(stats, { histogramBins: "all", color: false });
    expect(allBins).toContain("100-200ms");
    expect(allBins).toContain("200-300ms");
    expect(allBins).toContain("300-400ms");
    expect(allBins).toContain("400-500ms");
    expect(allBins).not.toContain("empty bins");
  });

  it("renders zero-duration tests without NaN percentages", () => {
    const report = formatTimingStats(
      createTimingStats([{ name: "instant", file: "fixture.test.ts", durationMs: 0 }]),
      { color: false }
    );

    expect(report).not.toContain("NaN");
    expect(report).toContain(
      "1.     0ms  ······························   0.0%  fixture.test.ts > instant"
    );
  });

  it("aligns execution-time split bars despite unequal count labels", () => {
    const stats = createTimingStats(
      Array.from({ length: 11 }, (_, index) => ({
        name: `test ${index}`,
        file: "fixture.test.ts",
        durationMs: index === 0 ? 1_000 : 10,
      })),
      { slowThresholdMs: 500 }
    );
    const report = formatTimingStats(stats, {
      color: false,
      histogramFillChar: "#",
      histogramEmptyChar: "-",
    });
    const slowLine = report.split("\n").find((line) => line.startsWith("  slow"))!;
    const fastLine = report.split("\n").find((line) => line.startsWith("  fast"))!;

    expect(slowLine.indexOf("#")).toBe(fastLine.indexOf("#"));
  });

  it("uses configured bar characters consistently across every chart", () => {
    const report = formatTimingStats(createTimingStats(fixture, { slowThresholdMs: 100 }), {
      color: false,
      histogramFillChar: "#",
      histogramEmptyChar: "-",
    });

    expect(report).toContain("###############---------------");
    expect(report).toContain("slow (25% of tests)  ###############---------------  49% of time");
    expect(report).toContain(
      "1.   201ms  ###############---------------    49%  fixture.test.ts > slow"
    );
  });

  it("colors severity-bearing fill bars to match their adjacent statistics", () => {
    const report = formatTimingStats(createTimingStats(fixture, { slowThresholdMs: 100 }), {
      color: true,
    });

    // The 201ms slowest test is red and occupies 49% of total execution time.
    expect(report).toContain(`\u001B[31m${"█".repeat(15)}\u001B[39m`);
    // Histogram and fast-split fills remain neutral cyan.
    expect(report).toContain(`\u001B[36m${"█".repeat(15)}\u001B[39m`);
  });

  it("uses ANSI styling only when colors are enabled", () => {
    const stats = createTimingStats(fixture);

    expect(formatTimingStats(stats, { color: true })).toContain("\u001B[1mTime Stats:");
    expect(formatTimingStats(stats, { color: false })).not.toContain("\u001B[");
  });

  it("rejects invalid configuration and handles no completed tests", () => {
    expect(() => createTimingStats([], { binSizeMs: 0 })).toThrow(
      "binSizeMs must be greater than 0"
    );
    expect(() =>
      formatTimingStats(createTimingStats([]), { histogramBins: "hidden" as never })
    ).toThrow('histogramBins must be either "collapse" or "all"');
    expect(() =>
      createTimingStats([{ name: "long", file: "fixture.test.ts", durationMs: 300_000 }], {
        binSizeMs: 1,
      })
    ).toThrow("binSizeMs would produce 300001 histogram bins");
    expect(formatTimingStats(createTimingStats([]), { color: false })).toContain(
      "no completed test cases"
    );
  });

  describe("bar character customization", () => {
    it("defaults to full block (█) and middle dot (·)", () => {
      const report = formatTimingStats(createTimingStats(fixture), { color: false });
      // The first bin (0-100ms) has 50% = 15 filled chars out of 30
      expect(report).toContain("\u2588".repeat(15));
      expect(report).toContain("\u00B7".repeat(15));
    });

    it("accepts custom fill and empty chars", () => {
      const report = formatTimingStats(createTimingStats(fixture), {
        histogramFillChar: "\u25A0",
        histogramEmptyChar: "\u25A1",
        color: false,
      });
      // 0-100ms bin: 50% fill = 15 characters
      expect(report).toContain("\u25A0".repeat(15));
      expect(report).toContain("\u25A1".repeat(15));
    });

    it("accepts the ▮/▯ pairing", () => {
      const report = formatTimingStats(createTimingStats(fixture), {
        histogramFillChar: "\u25AE",
        histogramEmptyChar: "\u25AF",
        color: false,
      });
      // 0-100ms bin: 50% fill = 15 characters
      expect(report).toContain("\u25AE".repeat(15));
      expect(report).toContain("\u25AF".repeat(15));
    });

    it("resets both chars to defaults when either configured value is invalid", () => {
      const stats = createTimingStats(fixture);
      const defaultReport = formatTimingStats(stats, { color: false });

      for (const options of [
        { histogramFillChar: "", histogramEmptyChar: "-" },
        { histogramFillChar: "#", histogramEmptyChar: "" },
        { histogramFillChar: "##", histogramEmptyChar: "-" },
        { histogramFillChar: "\n", histogramEmptyChar: "-" },
      ]) {
        expect(formatTimingStats(stats, { ...options, color: false })).toBe(defaultReport);
      }
    });

    it("works with single-char ASCII symbols", () => {
      const report = formatTimingStats(createTimingStats(fixture), {
        histogramFillChar: "#",
        histogramEmptyChar: "-",
        color: false,
      });
      expect(report).toContain("#".repeat(15));
      expect(report).toContain("-".repeat(15));
    });

    it("custom chars appear in all bins proportionally", () => {
      const report = formatTimingStats(createTimingStats(fixture, { binSizeMs: 100 }), {
        histogramFillChar: "\u25A0",
        histogramEmptyChar: "\u25A1",
        color: false,
      });
      // 0-100ms: 50% = 15 filled, 15 empty
      expect(report).toContain("\u25A0".repeat(15) + "\u25A1".repeat(15));
      // 100-200ms: 25% = 7.5 ~ 8 filled, 22 empty
      expect(report).toContain("\u25A0".repeat(8) + "\u25A1".repeat(22));
      // 200-300ms: 25% = 7.5 ~ 8 filled, 22 empty
      expect(report).toContain("\u25A0".repeat(8) + "\u25A1".repeat(22));
    });

    it("preserves defaults when only one custom char is provided", () => {
      const report = formatTimingStats(createTimingStats(fixture), {
        histogramFillChar: "#",
        color: false,
      });
      expect(report).toContain("#".repeat(15));
      expect(report).toContain("\u00B7".repeat(15));
    });
  });
});
