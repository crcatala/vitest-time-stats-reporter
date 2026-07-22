# vitest-time-stats-reporter

An **additive** Vitest reporter that answers a question built-in slow-test highlighting does not: **what is the shape of this suite's test execution-time distribution?**

It composes with existing terminal and CI reporters rather than replacing them. Just add it to your `reporters` array alongside `'default'`, `'verbose'`, `'json'`, or any other reporter.

## Install

```bash
npm install --save-dev vitest-time-stats-reporter
```

## Usage

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: [
      'default',
      ['vitest-time-stats-reporter', {
        binSizeMs: 100,
        slowThresholdMs: 500,
        slowestTestsCount: 5,
        histogramBins: 'collapse',
      }],
    ],
  },
})
```

### Terminal output

The reporter appends a compact summary after the default reporter's output:

```
Time Stats: 42 tests; 6.78s total test execution (2 slow)

Duration distribution:
    0-100ms  ███████████████████···········    62%  26
  100-200ms  ███████·······················    24%  10
  200-300ms  ███···························   9.5%   4
  300-800ms  ······························   0.0%   0 (5 empty bins)
  800-900ms  █·····························   4.8%   2

Percentiles:
  p50   80ms
  p90  280ms
  p99  890ms
  max  890ms

Slow tests: 2/42 over 500ms (4.8% of tests; 26% of execution time)

Slowest tests:
  1.   890ms  tests/auth.test.ts > Auth > login with invalid credentials retries
  2.   890ms  tests/db.test.ts > Database > migration rolls back on error
  3.   280ms  tests/api.test.ts > API > rate limiter blocks after 100 requests
```

Headers, populated histogram bars, durations, and slow-test concentration are styled when the terminal supports ANSI color. Text written through `outputFile` stays unstyled. By default, runs of two or more empty histogram bins are collapsed into one range; use `histogramBins: 'all'` to render each bin.

### JSON / agent output

For CI or agent-based analysis, use the `output: 'json'` option and write to a separate file:

```ts
reporters: [
  ['vitest-time-stats-reporter', {
    output: 'json',
    outputFile: 'reports/time-stats.json',
  }],
]
```

The JSON schema is versioned (`schemaVersion: 1`) and includes all fields from the terminal report as structured data.

## Options

| Option | Default | Description |
|---|---|---|
| `binSizeMs` | 100 | Width of each histogram bin in milliseconds |
| `slowThresholdMs` | 500 | Tests above this duration are considered "slow" |
| `slowestTestsCount` | 5 | Number of slowest tests to rank |
| `histogramBins` | `'collapse'` | `'collapse'` combines runs of empty bins; `'all'` renders every bin |
| `histogramFillChar` | `'█'` | Character for the filled portion of each histogram bar. Common pairings: `'■'` with empty char `'□'`, `'▮'` with empty char `'▯'` |
| `histogramEmptyChar` | `'·'` | Character for the empty portion of each histogram bar. Common pairings: `'□'` with fill char `'■'`, `'▯'` with fill char `'▮'` |
| `output` | `'text'` | `'text'` for terminal output, `'json'` for machine-readable |
| `outputFile` | — | Write output to a file instead of stdout |

Both histogram characters must be single printable characters. If either value is invalid, both fall back to the default `'█'` / `'·'` pairing.

## How it works

The reporter implements Vitest's `Reporter` interface and hooks into `onTestRunEnd` to collect every completed test case's name, file, and duration. All aggregation and formatting is done by runner-agnostic pure functions in `src/timing-stats.ts`, which are independently unit-tested.

## Development

```bash
npm install
npm run verify   # typecheck + unit tests + demos
```

## See Also

- [RELEASING.md](RELEASING.md) — release workflow and versioning
- [CHANGELOG.md](CHANGELOG.md) — version history
- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution guidelines

## License

MIT