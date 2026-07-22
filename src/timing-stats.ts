import picocolors from "picocolors";

type Colors = ReturnType<typeof picocolors.createColors>;

export type TimedTest = {
  name: string;
  file: string;
  durationMs: number;
};

export type HistogramBins = "collapse" | "all";

export type TimingStatsOptions = {
  binSizeMs?: number;
  slowThresholdMs?: number;
  slowestTestsCount?: number;
};

export type FormatTimingStatsOptions = {
  /** Whether empty histogram bins are collapsed into ranges or shown individually. */
  histogramBins?: HistogramBins;
  /** Enable ANSI styles. Defaults to the terminal's detected color support. */
  color?: boolean;
  /**
   * Character used for the filled portion of each histogram bar.
   * Defaults to "█" (U+2588 Full Block).
   * Other common pairings: "■" (filled square) / "□" (empty square),
   * "▮" (filled square) / "▯" (empty square).
   * Both bar characters must be single printable characters; an invalid value resets both to defaults.
   */
  histogramFillChar?: string;
  /**
   * Character used for the empty portion of each histogram bar.
   * Defaults to "·" (U+00B7 Middle Dot).
   * Other common pairings: "□" with fill char "■", "▯" with fill char "▮".
   * Both bar characters must be single printable characters; an invalid value resets both to defaults.
   */
  histogramEmptyChar?: string;
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

type DisplayHistogramBin = HistogramBin & { emptyBinCount?: number };

const histogramBarWidth = 30;
const defaultHistogramFillChar = "\u2588";
const defaultHistogramEmptyChar = "\u00B7";

function isValidHistogramChar(value: unknown): value is string {
  return typeof value === "string" && value.length === 1 && !/[\p{C}\p{M}]/u.test(value);
}

function formatBar(
  percentage: number,
  fillChar: string,
  emptyChar: string,
  colors: Colors
): string {
  const filledBarLength = Math.round((percentage / 100) * histogramBarWidth);
  return `${colors.cyan(fillChar.repeat(filledBarLength))}${colors.dim(
    emptyChar.repeat(histogramBarWidth - filledBarLength)
  )}`;
}

function collapseEmptyBins(histogram: HistogramBin[]): DisplayHistogramBin[] {
  const displayed: DisplayHistogramBin[] = [];

  for (let index = 0; index < histogram.length; ) {
    const bin = histogram[index]!;
    if (bin.count !== 0) {
      displayed.push(bin);
      index += 1;
      continue;
    }

    let endIndex = index + 1;
    while (histogram[endIndex]?.count === 0) endIndex += 1;

    const emptyBinCount = endIndex - index;
    if (emptyBinCount === 1) {
      displayed.push(bin);
    } else {
      displayed.push({
        startMs: bin.startMs,
        endMs: histogram[endIndex - 1]!.endMs,
        count: 0,
        percentage: 0,
        emptyBinCount,
      });
    }
    index = endIndex;
  }

  return displayed;
}

function colorForDuration(
  durationMs: number,
  thresholdMs: number,
  text: string,
  colors: Colors
): string {
  if (durationMs > thresholdMs) return colors.red(text);
  if (durationMs > thresholdMs / 2) return colors.yellow(text);
  return colors.green(text);
}

export function formatTimingStats(
  stats: TimingStats,
  {
    histogramBins = "collapse",
    color,
    histogramFillChar = defaultHistogramFillChar,
    histogramEmptyChar = defaultHistogramEmptyChar,
  }: FormatTimingStatsOptions = {}
): string {
  if (histogramBins !== "collapse" && histogramBins !== "all") {
    throw new Error('histogramBins must be either "collapse" or "all"');
  }
  const [fillChar, emptyChar] =
    isValidHistogramChar(histogramFillChar) && isValidHistogramChar(histogramEmptyChar)
      ? [histogramFillChar, histogramEmptyChar]
      : [defaultHistogramFillChar, defaultHistogramEmptyChar];

  const colors = picocolors.createColors(color);
  if (stats.testCount === 0) {
    return `\n${colors.bold("Time Stats:")} no completed test cases were reported.\n`;
  }

  const histogram: DisplayHistogramBin[] =
    histogramBins === "all" ? stats.histogram : collapseEmptyBins(stats.histogram);
  const widestBinLabel = Math.max(
    ...histogram.map((bin) => `${bin.startMs}-${bin.endMs}ms`.length)
  );
  const widestCount = Math.max(...histogram.map((bin) => String(bin.count).length));
  const percentileRows = [
    ["p50", stats.percentiles.p50],
    ["p90", stats.percentiles.p90],
    ["p99", stats.percentiles.p99],
    ["max", stats.percentiles.max],
  ] as const;
  const widestPercentile = Math.max(
    ...percentileRows.map(([, durationMs]) => formatMilliseconds(durationMs).length)
  );
  const slowBadge = `${stats.slow.count} slow`;
  const summary = `${stats.testCount} tests; ${formatMilliseconds(stats.totalExecutionMs)} total test execution`;
  const lines = [
    "",
    `${colors.bold("Time Stats:")} ${summary} ${colorForDuration(
      stats.slow.executionPercentage,
      50,
      `(${slowBadge})`,
      colors
    )}`,
    "",
    colors.bold("Duration distribution:"),
  ];

  for (const bin of histogram) {
    const label = `${bin.startMs}-${bin.endMs}ms`.padStart(widestBinLabel);
    const bar = formatBar(bin.percentage, fillChar, emptyChar, colors);
    const percentage = formatPercent(bin.percentage).padStart(5);
    const binSuffix = bin.emptyBinCount ? colors.dim(` (${bin.emptyBinCount} empty bins)`) : "";
    lines.push(
      `  ${label}  ${bar}  ${bin.count === 0 ? colors.dim(percentage) : colors.green(percentage)}  ${String(bin.count).padStart(widestCount)}${binSuffix}`
    );
  }

  lines.push("", colors.bold("Percentiles:"));
  for (const [label, durationMs] of percentileRows) {
    const duration = formatMilliseconds(durationMs).padStart(widestPercentile);
    lines.push(
      `  ${colors.dim(label.padEnd(3))}  ${colorForDuration(
        durationMs,
        stats.slow.thresholdMs,
        duration,
        colors
      )}`
    );
  }

  const slowSummary = `${stats.slow.count}/${stats.testCount} over ${formatMilliseconds(stats.slow.thresholdMs)} (${formatPercent(stats.slow.percentage)} of tests; ${formatPercent(stats.slow.executionPercentage)} of execution time)`;
  const slowMessage = `${colors.bold("Slow tests:")} ${slowSummary}`;
  lines.push("", colorForDuration(stats.slow.executionPercentage, 50, slowMessage, colors));

  const timeSplitRows = [
    ["slow", stats.slow.percentage, stats.slow.executionPercentage],
    ["fast", 100 - stats.slow.percentage, 100 - stats.slow.executionPercentage],
  ] as const;
  const widestTimeSplitLabel = Math.max(
    ...timeSplitRows.map(
      ([kind, testPercentage]) => `${kind} (${formatPercent(testPercentage)} of tests)`.length
    )
  );
  lines.push("", colors.bold("Execution time split:"));
  for (const [kind, testPercentage, executionPercentage] of timeSplitRows) {
    const label = `${kind} (${formatPercent(testPercentage)} of tests)`.padEnd(
      widestTimeSplitLabel
    );
    lines.push(
      `  ${label}  ${formatBar(executionPercentage, fillChar, emptyChar, colors)}  ${formatPercent(executionPercentage)} of time`
    );
  }

  if (stats.slowest.length > 0) {
    lines.push("", colors.bold("Slowest tests' share of total execution:"));
    for (const [index, test] of stats.slowest.entries()) {
      const duration = formatMilliseconds(test.durationMs).padStart(7);
      const executionPercentage =
        stats.totalExecutionMs === 0 ? 0 : (test.durationMs / stats.totalExecutionMs) * 100;
      lines.push(
        `  ${colors.dim(`${index + 1}.`.padStart(2))} ${colorForDuration(test.durationMs, stats.slow.thresholdMs, duration, colors)}  ${formatBar(executionPercentage, fillChar, emptyChar, colors)}  ${formatPercent(executionPercentage).padStart(5)}  ${test.file} > ${test.name}`
      );
    }
  }

  return `${lines.join("\n")}\n`;
}
