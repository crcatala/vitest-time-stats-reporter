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

export type HistogramBin = {
  startMs: number;
  endMs: number;
  count: number;
  percentage: number;
};

export type TimingStats = {
  testCount: number;
  totalExecutionMs: number;
  minMs: number;
  meanMs: number;
  percentiles: { p50: number; p90: number; p99: number; max: number };
  histogram: HistogramBin[];
  slow: {
    thresholdMs: number;
    count: number;
    percentage: number;
    executionPercentage: number;
  };
  slowest: TimedTest[];
};

const defaults = {
  binSizeMs: 100,
  slowThresholdMs: 500,
  slowestTestsCount: 5,
};

const maxHistogramBins = 10_000;

function percentile(sortedDurations: number[], percentileValue: number): number {
  const index = Math.max(0, Math.ceil((percentileValue / 100) * sortedDurations.length) - 1);
  return sortedDurations[index] ?? 0;
}

export function createTimingStats(
  tests: TimedTest[],
  options: TimingStatsOptions = {}
): TimingStats {
  const config = { ...defaults, ...options };
  if (config.binSizeMs <= 0) throw new Error("binSizeMs must be greater than 0");
  if (config.slowThresholdMs < 0) throw new Error("slowThresholdMs must be non-negative");
  if (config.slowestTestsCount < 0) throw new Error("slowestTestsCount must be non-negative");

  const completedTests = tests.filter(
    (test) => Number.isFinite(test.durationMs) && test.durationMs >= 0
  );
  const durations = completedTests.map((test) => test.durationMs).sort((a, b) => a - b);
  const totalExecutionMs = durations.reduce((sum, duration) => sum + duration, 0);
  const maxMs = durations.at(-1) ?? 0;
  const binCount = completedTests.length === 0 ? 0 : Math.floor(maxMs / config.binSizeMs) + 1;
  if (binCount > maxHistogramBins) {
    throw new Error(
      `binSizeMs would produce ${binCount} histogram bins; increase it to produce at most ${maxHistogramBins}`
    );
  }

  const histogram = Array.from({ length: binCount }, (_, index) => ({
    startMs: index * config.binSizeMs,
    endMs: (index + 1) * config.binSizeMs,
    count: 0,
    percentage: 0,
  }));

  for (const duration of durations) {
    const index = Math.floor(duration / config.binSizeMs);
    histogram[index]!.count += 1;
  }
  for (const bin of histogram) bin.percentage = (bin.count / completedTests.length) * 100;

  const slowTests = completedTests.filter((test) => test.durationMs > config.slowThresholdMs);
  const slowExecutionMs = slowTests.reduce((sum, test) => sum + test.durationMs, 0);

  return {
    testCount: completedTests.length,
    totalExecutionMs,
    minMs: durations[0] ?? 0,
    meanMs: completedTests.length === 0 ? 0 : totalExecutionMs / completedTests.length,
    percentiles: {
      p50: percentile(durations, 50),
      p90: percentile(durations, 90),
      p99: percentile(durations, 99),
      max: maxMs,
    },
    histogram,
    slow: {
      thresholdMs: config.slowThresholdMs,
      count: slowTests.length,
      percentage:
        completedTests.length === 0 ? 0 : (slowTests.length / completedTests.length) * 100,
      executionPercentage: totalExecutionMs === 0 ? 0 : (slowExecutionMs / totalExecutionMs) * 100,
    },
    slowest: [...completedTests]
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, config.slowestTestsCount),
  };
}

export function formatMilliseconds(durationMs: number): string {
  if (durationMs >= 1_000) return `${(durationMs / 1_000).toFixed(2)}s`;
  return `${Math.round(durationMs)}ms`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(value < 10 ? 1 : 0)}%`;
}

export function formatTimingStats(stats: TimingStats): string {
  if (stats.testCount === 0) return "\nTime Stats: no completed test cases were reported.\n";

  const widestBinLabel = Math.max(
    ...stats.histogram.map((bin) => `${bin.startMs}-${bin.endMs}ms`.length)
  );
  const lines = [
    "",
    `Time Stats: ${stats.testCount} tests; ${formatMilliseconds(stats.totalExecutionMs)} total test execution`,
    "Duration distribution:",
  ];

  for (const bin of stats.histogram) {
    const label = `${bin.startMs}-${bin.endMs}ms`.padStart(widestBinLabel);
    const bar = "█".repeat(Math.round((bin.percentage / 100) * 24)) || "·";
    lines.push(
      `  ${label}  ${bar.padEnd(24)}  ${formatPercent(bin.percentage).padStart(5)}  ${bin.count}`
    );
  }

  lines.push(
    `Percentiles: p50 ${formatMilliseconds(stats.percentiles.p50)} | p90 ${formatMilliseconds(stats.percentiles.p90)} | p99 ${formatMilliseconds(stats.percentiles.p99)} | max ${formatMilliseconds(stats.percentiles.max)}`,
    `Slow tests: ${stats.slow.count}/${stats.testCount} over ${formatMilliseconds(stats.slow.thresholdMs)} (${formatPercent(stats.slow.percentage)} of tests; ${formatPercent(stats.slow.executionPercentage)} of execution time)`
  );

  if (stats.slowest.length > 0) {
    lines.push("Slowest tests:");
    for (const [index, test] of stats.slowest.entries()) {
      lines.push(
        `  ${index + 1}. ${formatMilliseconds(test.durationMs).padStart(7)}  ${test.file} > ${test.name}`
      );
    }
  }

  return `${lines.join("\n")}\n`;
}
