import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { describe, expect, it } from "vitest";

const projectDir = resolve(import.meta.dirname, "..");
const jsonOutputFile = resolve(projectDir, "reports", "time-stats.json");
const textOutputFile = resolve(projectDir, "reports", "time-stats.txt");

function runVitest(configFile: string, env?: NodeJS.ProcessEnv): { stdout: string } {
  const childEnv = { ...process.env, ...env };
  for (const [key, value] of Object.entries(childEnv)) {
    if (value === undefined) delete childEnv[key];
  }

  const stdout = execSync(
    `"${resolve(projectDir, "node_modules", ".bin", "vitest")}" run --config "${resolve(projectDir, configFile)}"`,
    { cwd: projectDir, encoding: "utf-8", env: childEnv, timeout: 30_000 }
  );
  return { stdout };
}

describe("subprocess integration", () => {
  it("appends a terminal report alongside the default reporter", () => {
    const { stdout } = runVitest("vitest.demo.config.ts");
    const report = stripVTControlCharacters(stdout);

    // The fixture has 3 tests with widely-spaced sleeps.
    // We assert structural shape, not exact wall-clock timings.
    expect(report).toContain("Time Stats: 3 tests;");
    expect(report).toContain("total test execution");
    expect(report).toContain("Duration distribution:");
    expect(report).toContain("Percentiles:");
    expect(report).toContain("p50");
    expect(report).toContain("p90");
    expect(report).toContain("p99");
    expect(report).toContain("max");
    expect(report).toContain("Slow tests:");
    expect(report).toContain("of execution time");
    expect(report).toContain("Execution time split:");
    expect(report).toContain("Slowest tests' share of total execution:");
    expect(report).toContain("fixture/distribution.fixture.test.ts");
  });

  it("writes an unstyled text artifact", () => {
    if (existsSync(textOutputFile)) unlinkSync(textOutputFile);

    runVitest("vitest.demo-text-file.config.ts");

    expect(existsSync(textOutputFile)).toBe(true);
    const report = readFileSync(textOutputFile, "utf-8");
    expect(report).toBe(stripVTControlCharacters(report));
    expect(report).toContain("Time Stats: 3 tests;");
    expect(report).toContain("Percentiles:");
    expect(report).not.toContain("empty bins");

    const histogramBins = [...report.matchAll(/^\s*(\d+)-(\d+)ms\s+.*\s(\d+)\s*$/gm)].map(
      ([, startMs, endMs, count]) => ({
        startMs: Number(startMs),
        endMs: Number(endMs),
        count: Number(count),
      })
    );
    expect(
      histogramBins.some(
        (bin, index) =>
          bin.count === 0 &&
          histogramBins[index + 1]?.count === 0 &&
          bin.endMs === histogramBins[index + 1]?.startMs
      )
    ).toBe(true);
  });

  it("honors automatic color environment controls", () => {
    const redirected = runVitest("vitest.demo-color.config.ts", {
      CI: undefined,
      FORCE_COLOR: undefined,
      NO_COLOR: undefined,
    });
    expect(redirected.stdout).not.toContain("\u001B[");

    const colored = runVitest("vitest.demo-color.config.ts", {
      CI: undefined,
      FORCE_COLOR: "1",
      NO_COLOR: undefined,
    });
    expect(colored.stdout).toContain("\u001B[1mTime Stats:");

    const noColor = runVitest("vitest.demo-color.config.ts", {
      CI: undefined,
      FORCE_COLOR: undefined,
      NO_COLOR: "1",
    });
    expect(noColor.stdout).not.toContain("\u001B[");
  });

  it("writes a valid JSON artifact in JSON mode", () => {
    // Clean up from a previous run
    if (existsSync(jsonOutputFile)) unlinkSync(jsonOutputFile);

    runVitest("vitest.demo-json.config.ts");

    expect(existsSync(jsonOutputFile)).toBe(true);

    const raw = readFileSync(jsonOutputFile, "utf-8");
    const report = JSON.parse(raw) as Record<string, unknown>;

    // Top-level schema
    expect(report.schemaVersion).toBe(1);
    expect(report.kind).toBe("vitest-time-stats");

    // Required numeric fields
    expect(report.testCount).toBe(3);
    expect(typeof report.totalExecutionMs).toBe("number");
    expect(Number.isFinite(report.totalExecutionMs)).toBe(true);
    expect(typeof report.minMs).toBe("number");
    expect(typeof report.meanMs).toBe("number");

    // Percentiles
    const p = report.percentiles as Record<string, unknown>;
    expect(typeof p.p50).toBe("number");
    expect(typeof p.p90).toBe("number");
    expect(typeof p.p99).toBe("number");
    expect(typeof p.max).toBe("number");

    // Histogram
    expect(Array.isArray(report.histogram)).toBe(true);
    const bins = report.histogram as Array<Record<string, unknown>>;
    expect(bins.length).toBeGreaterThan(0);
    for (const bin of bins) {
      expect(typeof bin.startMs).toBe("number");
      expect(typeof bin.endMs).toBe("number");
      expect(typeof bin.count).toBe("number");
      expect(typeof bin.percentage).toBe("number");
      expect(Number.isFinite(bin.percentage)).toBe(true);
      expect((bin.percentage as number) >= 0 && (bin.percentage as number) <= 100).toBe(true);
    }
    // Bin counts should sum to testCount
    const totalBinCount = bins.reduce((sum, bin) => sum + (bin.count as number), 0);
    expect(totalBinCount).toBe(3);

    // Slow summary
    const slow = report.slow as Record<string, unknown>;
    expect(typeof slow.thresholdMs).toBe("number");
    expect(typeof slow.count).toBe("number");
    expect(typeof slow.percentage).toBe("number");
    expect(typeof slow.executionPercentage).toBe("number");

    // Slowest tests
    expect(Array.isArray(report.slowest)).toBe(true);
    const slowest = report.slowest as Array<Record<string, unknown>>;
    expect(slowest.length).toBeGreaterThan(0);
    for (const entry of slowest) {
      expect(typeof entry.name).toBe("string");
      expect(typeof entry.file).toBe("string");
      expect(typeof entry.durationMs).toBe("number");
      expect(Number.isFinite(entry.durationMs)).toBe(true);
    }
  });
});
