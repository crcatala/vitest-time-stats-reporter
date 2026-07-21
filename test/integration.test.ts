import { execSync } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectDir = resolve(import.meta.dirname, '..')
const jsonOutputFile = resolve(projectDir, 'reports', 'time-stats.json')

function runVitest(configFile: string): { stdout: string } {
  const stdout = execSync(
    `"${resolve(projectDir, 'node_modules', '.bin', 'vitest')}" run --config "${resolve(projectDir, configFile)}"`,
    { cwd: projectDir, encoding: 'utf-8', timeout: 30_000 },
  )
  return { stdout }
}

describe('subprocess integration', () => {
  it('appends a terminal report alongside the default reporter', () => {
    const { stdout } = runVitest('vitest.demo.config.ts')

    // The fixture has 3 tests with widely-spaced sleeps.
    // We assert structural shape, not exact wall-clock timings.
    expect(stdout).toContain('Time Stats: 3 tests;')
    expect(stdout).toContain('total test execution')
    expect(stdout).toContain('Duration distribution:')
    expect(stdout).toContain('Percentiles: p50')
    expect(stdout).toContain('p90')
    expect(stdout).toContain('p99')
    expect(stdout).toContain('max')
    expect(stdout).toContain('Slow tests:')
    expect(stdout).toContain('of execution time')
    expect(stdout).toContain('Slowest tests:')
    expect(stdout).toContain('fixture/distribution.fixture.test.ts')
  })

  it('writes a valid JSON artifact in JSON mode', () => {
    // Clean up from a previous run
    if (existsSync(jsonOutputFile)) unlinkSync(jsonOutputFile)

    runVitest('vitest.demo-json.config.ts')

    expect(existsSync(jsonOutputFile)).toBe(true)

    const raw = readFileSync(jsonOutputFile, 'utf-8')
    const report = JSON.parse(raw) as Record<string, unknown>

    // Top-level schema
    expect(report.schemaVersion).toBe(1)
    expect(report.kind).toBe('vitest-time-stats')

    // Required numeric fields
    expect(report.testCount).toBe(3)
    expect(typeof report.totalExecutionMs).toBe('number')
    expect(Number.isFinite(report.totalExecutionMs)).toBe(true)
    expect(typeof report.minMs).toBe('number')
    expect(typeof report.meanMs).toBe('number')

    // Percentiles
    const p = report.percentiles as Record<string, unknown>
    expect(typeof p.p50).toBe('number')
    expect(typeof p.p90).toBe('number')
    expect(typeof p.p99).toBe('number')
    expect(typeof p.max).toBe('number')

    // Histogram
    expect(Array.isArray(report.histogram)).toBe(true)
    const bins = report.histogram as Array<Record<string, unknown>>
    expect(bins.length).toBeGreaterThan(0)
    for (const bin of bins) {
      expect(typeof bin.startMs).toBe('number')
      expect(typeof bin.endMs).toBe('number')
      expect(typeof bin.count).toBe('number')
      expect(typeof bin.percentage).toBe('number')
      expect(Number.isFinite(bin.percentage)).toBe(true)
      expect((bin.percentage as number) >= 0 && (bin.percentage as number) <= 100).toBe(true)
    }
    // Bin counts should sum to testCount
    const totalBinCount = bins.reduce((sum, bin) => sum + (bin.count as number), 0)
    expect(totalBinCount).toBe(3)

    // Slow summary
    const slow = report.slow as Record<string, unknown>
    expect(typeof slow.thresholdMs).toBe('number')
    expect(typeof slow.count).toBe('number')
    expect(typeof slow.percentage).toBe('number')
    expect(typeof slow.executionPercentage).toBe('number')

    // Slowest tests
    expect(Array.isArray(report.slowest)).toBe(true)
    const slowest = report.slowest as Array<Record<string, unknown>>
    expect(slowest.length).toBeGreaterThan(0)
    for (const entry of slowest) {
      expect(typeof entry.name).toBe('string')
      expect(typeof entry.file).toBe('string')
      expect(typeof entry.durationMs).toBe('number')
      expect(Number.isFinite(entry.durationMs)).toBe(true)
    }
  })
})
