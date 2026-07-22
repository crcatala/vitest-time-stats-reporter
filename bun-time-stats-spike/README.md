# Bun time-stats reporter spike

This is an intentionally self-contained proof of concept for collecting `bun test` timings through Bun's WebKit Inspector Protocol. It does not affect the parent Vitest package.

## Run

```bash
cd bun-time-stats-spike
bun install
bun ./src/cli.ts -- -- test fixture/sample.test.ts
```

The arguments after `--` are passed directly to Bun. For example:

```bash
bun ./src/cli.ts -- --slow-threshold-ms 50 -- test
bun ./src/cli.ts -- --output json --output-file reports/time-stats.json -- test
```

## What it proves

The CLI starts `bun --inspect=127.0.0.1:9229 test ...`, injects a temporary preload that blocks test-module evaluation, then opens its inspector WebSocket and enables `TestReporter`. The preload is released only after the reporter subscribes, avoiding the normal discovery-event race. It correlates:

- `TestReporter.found` — test names, files, and describe nesting
- `TestReporter.end` — per-test elapsed duration

It then prints the timing distribution after Bun's normal test output.

## Deliberate spike limitations

- The inspector port defaults to `9229`; use `--port` for concurrent runs.
- The client is a wrapper command, not a `bun test` config plugin.
- Bun 1.3.14 exposes `elapsed` in nanoseconds even though the generated protocol type documentation says milliseconds; the spike converts it to milliseconds.
- With the included two-test fixture on Bun 1.3.14, `TestReporter.end` is emitted only for the first test, even though both tests pass. This is a blocker for production use and needs a minimal upstream reproduction/issue before any spin-off.
- It treats every discovered `type: "test"` item that emits `end` as a completed test, including non-passing statuses.
- It finalizes when Bun closes the inspector connection. Production work should add compatibility/version tests and better lifecycle/error diagnostics.
