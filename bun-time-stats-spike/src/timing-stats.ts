import picocolors from "picocolors";

type Colors = ReturnType<typeof picocolors.createColors>;

export type TimedTest = {
  name: string;
  file: string;
  durationMs: number;
};

export type TimingStatsOptions = {
  binSizeMs?: number;
  slowThresholdMs?: number;
  slowestTestsCount?: number;
};

export type TimingStats = {
  testCount: number;
  totalExecutionMs: number;
  minMs: number;
  meanMs: number;
  percentiles: { p50: number; p90: number; p99: number; max: number };
  histogram: { startMs: number; endMs: number; count: number; percentage: number }[];
  slow: { thresholdMs: number; count: number; percentage: number; executionPercentage: number };
  slowest: TimedTest[];
};

const defaults = { binSizeMs: 100, slowThresholdMs: 500, slowestTestsCount: 5 };

function percentile(sorted: number[], value: number): number {
  return sorted[Math.max(0, Math.ceil((value / 100) * sorted.length) - 1)] ?? 0;
}

export function createTimingStats(tests: TimedTest[], options: TimingStatsOptions = {}): TimingStats {
  const config = { ...defaults, ...options };
  if (config.binSizeMs <= 0) throw new Error("binSizeMs must be greater than 0");

  const completed = tests.filter((test) => Number.isFinite(test.durationMs) && test.durationMs >= 0);
  const durations = completed.map((test) => test.durationMs).sort((a, b) => a - b);
  const totalExecutionMs = durations.reduce((sum, duration) => sum + duration, 0);
  const maxMs = durations.at(-1) ?? 0;
  const binCount = completed.length === 0 ? 0 : Math.floor(maxMs / config.binSizeMs) + 1;
  const histogram = Array.from({ length: binCount }, (_, index) => ({
    startMs: index * config.binSizeMs,
    endMs: (index + 1) * config.binSizeMs,
    count: 0,
    percentage: 0,
  }));

  for (const duration of durations) histogram[Math.floor(duration / config.binSizeMs)]!.count += 1;
  for (const bin of histogram) bin.percentage = (bin.count / completed.length) * 100;

  const slowTests = completed.filter((test) => test.durationMs > config.slowThresholdMs);
  const slowExecutionMs = slowTests.reduce((sum, test) => sum + test.durationMs, 0);

  return {
    testCount: completed.length,
    totalExecutionMs,
    minMs: durations[0] ?? 0,
    meanMs: completed.length === 0 ? 0 : totalExecutionMs / completed.length,
    percentiles: { p50: percentile(durations, 50), p90: percentile(durations, 90), p99: percentile(durations, 99), max: maxMs },
    histogram,
    slow: {
      thresholdMs: config.slowThresholdMs,
      count: slowTests.length,
      percentage: completed.length === 0 ? 0 : (slowTests.length / completed.length) * 100,
      executionPercentage: totalExecutionMs === 0 ? 0 : (slowExecutionMs / totalExecutionMs) * 100,
    },
    slowest: [...completed].sort((a, b) => b.durationMs - a.durationMs).slice(0, config.slowestTestsCount),
  };
}

function formatMilliseconds(durationMs: number): string {
  return durationMs >= 1_000 ? `${(durationMs / 1_000).toFixed(2)}s` : `${Math.round(durationMs)}ms`;
}

export function formatTimingStats(stats: TimingStats, color = process.stdout.isTTY): string {
  const colors: Colors = picocolors.createColors(color);
  if (stats.testCount === 0) return `\n${colors.bold("Time Stats:")} no completed test cases were reported.\n`;

  const widestLabel = Math.max(...stats.histogram.map((bin) => `${bin.startMs}-${bin.endMs}ms`.length));
  const lines = [
    "",
    `${colors.bold("Time Stats:")} ${stats.testCount} tests; ${formatMilliseconds(stats.totalExecutionMs)} total test execution (${stats.slow.count} slow)`,
    "",
    colors.bold("Duration distribution:"),
  ];

  for (const bin of stats.histogram) {
    const label = `${bin.startMs}-${bin.endMs}ms`.padStart(widestLabel);
    const barLength = Math.round((bin.percentage / 100) * 30);
    lines.push(`  ${label}  ${colors.cyan("█".repeat(barLength))}${colors.dim("·".repeat(30 - barLength))}  ${bin.percentage.toFixed(bin.percentage < 10 ? 1 : 0).padStart(5)}%  ${bin.count}`);
  }

  lines.push("", colors.bold("Percentiles:"));
  for (const [label, value] of Object.entries(stats.percentiles)) lines.push(`  ${label.padEnd(3)}  ${formatMilliseconds(value)}`);
  lines.push("", `${colors.bold("Slow tests:")} ${stats.slow.count}/${stats.testCount} over ${formatMilliseconds(stats.slow.thresholdMs)} (${stats.slow.percentage.toFixed(1)}% of tests; ${stats.slow.executionPercentage.toFixed(1)}% of execution time)`);

  if (stats.slowest.length) {
    lines.push("", colors.bold("Slowest tests:"));
    for (const [index, test] of stats.slowest.entries()) lines.push(`  ${index + 1}. ${formatMilliseconds(test.durationMs).padStart(7)}  ${test.file} > ${test.name}`);
  }
  return `${lines.join("\n")}\n`;
}
