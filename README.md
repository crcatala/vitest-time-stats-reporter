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
      }],
    ],
  },
})
```

### Terminal output

The reporter appends a compact summary after the default reporter's output:

```
Time Stats: 42 tests; 12.34s total test execution
Duration distribution:
    0-100ms  ████████████████████    62%  26
 100-200ms  ████████                24%  10
 200-300ms  ████                    10%  4
 300-400ms  ██                       5%  2
Percentiles: p50 80ms | p90 280ms | p99 450ms | max 890ms
Slow tests: 3/42 over 500ms (7% of tests; 42% of execution time)
Slowest tests:
  1.   890ms  tests/auth.test.ts > Auth > login with invalid credentials retries
  2.   720ms  tests/db.test.ts > Database > migration rolls back on error
  3.   650ms  tests/api.test.ts > API > rate limiter blocks after 100 requests
```

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
| `output` | `'text'` | `'text'` for terminal output, `'json'` for machine-readable |
| `outputFile` | — | Write output to a file instead of stdout |

## How it works

The reporter implements Vitest's `Reporter` interface and hooks into `onTestRunEnd` to collect every completed test case's name, file, and duration. All aggregation and formatting is done by runner-agnostic pure functions in `src/timing-stats.ts`, which are independently unit-tested.

## v1 scope

- Configurable execution-time histogram
- Test count and total test execution time
- Percentiles: p50, p90, p99, and max
- Ranked slowest test cases
- Slow-test concentration (count/percentage above threshold, share of execution time)
- Compact JSON output with versioned schema
- Zero runtime dependencies

## Development

```bash
npm install
npm run verify   # typecheck + unit tests + demos
```

## License

MIT