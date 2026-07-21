# Vitest time-stats reporter: high-level plan

## Goal

Ship a small, additive Vitest reporter that answers a question built-in slow-test highlighting does not: **what is the shape of this suite's test execution-time distribution?**

The reporter must compose with users' existing terminal and CI reporters rather than replace them.

## v1 scope

### Human terminal report

- Configurable execution-time histogram (`binSizeMs`).
- Test count and total *test execution* time (the sum of test-case durations, explicitly not wall-clock suite time).
- Percentiles: p50, p90, p99, and max.
- Ranked slowest test cases, with file and full test name (`slowestTestsCount`).
- Slow-test concentration: count/percentage above `slowThresholdMs`, and their share of aggregate test execution time.
- Sensible defaults and zero runtime dependencies.

### Machine / agent report

- Optional compact JSON output with a documented, versioned schema.
- No ANSI codes or passed-test transcript in JSON mode.
- Enough location and timing context for an agent to decide whether to inspect a test, its fixture/setup, or imports.

### Product and quality

- TypeScript, ESM, strict type checking.
- Pure aggregation/formatting functions tested independently from Vitest.
- One end-to-end fixture with timings intentionally spaced far apart, testing reporter registration rather than fragile exact wall-clock timing.
- A clear terminal-reporter composition recipe: `['default', 'vitest-time-stats-reporter']`.
- **Next quality task:** add subprocess integration tests that assert text output with the default reporter and parse/schema-check a JSON `outputFile` artifact.

## Non-goals for v1

- Replacing Vitest's default, verbose, JSON, JUnit, or HTML reporters.
- CPU or heap root-cause profiling.
- Transform/import/setup phase attribution (not consistently exposed in the normal reporter lifecycle).
- Persisting historical data, baseline comparison, or regression gating.
- Flake detection, retries orchestration, test-order bisection, or CI sharding.
- A browser dashboard.
- Bun support. Bun supports custom test reporters through a different Inspector Protocol API, so it should be a separate adapter/package after Vitest is proven.

## Future enhancements to evaluate

1. **Per-file aggregation** — a compact "top files by aggregate execution time" view. Add only if it remains concise and distinguishable from test-level data.
2. **Baseline/regression CLI** — a separate command that reads two JSON reports and identifies statistically cautious regressions. Keep state/trend logic out of the reporter.
3. **Optional HTML renderer** — consume the same JSON schema, rather than making the reporter responsible for a UI.
4. **Vitest import diagnostics integration** — only when Vitest exposes a stable, reporter-friendly API; report execution time and import/setup time as distinct measures.
5. **Bun adapter** — reuse the runner-agnostic aggregation package, with an Inspector-Protocol collector.

## Decision rules against bloat

A proposed feature belongs in the reporter only if it is available from normal reporter lifecycle data, answers a distinct timing-distribution question, and fits in a compact terminal/JSON summary. Root-cause profilers, dashboards, historical analysis, and test orchestration should consume the reporter's JSON instead.
