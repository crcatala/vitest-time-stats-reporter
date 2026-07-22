import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createTimingStats, formatTimingStats, type TimedTest, type TimingStatsOptions } from "./timing-stats.ts";

type FoundTest = {
  id: number;
  name?: string;
  type?: "test" | "describe";
  url?: string;
  parentId?: number;
};

type InspectorMessage = {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { message?: string };
};

type CliOptions = TimingStatsOptions & {
  port: number;
  output?: "text" | "json";
  outputFile?: string;
  testArgs: string[];
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { port: 9229, testArgs: [] };
  const testSeparator = argv.indexOf("--");
  const optionArgs = testSeparator === -1 ? argv : argv.slice(0, testSeparator);
  options.testArgs = testSeparator === -1 ? [] : argv.slice(testSeparator + 1);

  for (let index = 0; index < optionArgs.length; index += 1) {
    const flag = optionArgs[index]!;
    const value = optionArgs[++index];
    switch (flag) {
      case "--port": options.port = Number(value); break;
      case "--bin-size-ms": options.binSizeMs = Number(value); break;
      case "--slow-threshold-ms": options.slowThresholdMs = Number(value); break;
      case "--slowest-tests-count": options.slowestTestsCount = Number(value); break;
      case "--output":
        if (value !== "text" && value !== "json") throw new Error("--output must be text or json");
        options.output = value;
        break;
      case "--output-file": options.outputFile = value; break;
      default: throw new Error(`Unknown option: ${flag}`);
    }
  }
  if (!Number.isInteger(options.port) || options.port <= 0 || options.port > 65_535) throw new Error("--port must be a valid TCP port");
  if (options.testArgs.length === 0) throw new Error("Pass Bun test arguments after -- (for example: -- test)");
  return options;
}

function usage(): string {
  return `Usage: bun run src/cli.ts [options] -- [bun test arguments]\n\nExample:\n  bun run src/cli.ts -- --slow-threshold-ms 100 -- test fixture/sample.test.ts\n\nOptions:\n  --port <number>                 Inspector port (default: 9229)\n  --bin-size-ms <number>          Histogram bin width\n  --slow-threshold-ms <number>    Slow-test threshold\n  --slowest-tests-count <number>  Number of slowest tests to show\n  --output <text|json>            Report format (default: text)\n  --output-file <path>            Write report instead of stdout\n`;
}

function streamInspectorUrl(stderr: ReadableStream<Uint8Array>): {
  webSocketUrl: Promise<string>;
  finished: Promise<void>;
} {
  let resolveUrl!: (url: string) => void;
  let rejectUrl!: (error: Error) => void;
  const webSocketUrl = new Promise<string>((resolve, reject) => {
    resolveUrl = resolve;
    rejectUrl = reject;
  });
  const decoder = new TextDecoder();
  let buffered = "";
  const finished = (async () => {
    for await (const chunk of stderr) {
      const text = decoder.decode(chunk, { stream: true });
      process.stderr.write(text);
      buffered += text;
      const match = buffered.match(/ws:\/\/[^\s\u001b]+/);
      if (match) resolveUrl(match[0]);
      buffered = buffered.slice(-512);
    }
    if (!buffered.match(/ws:\/\/[^\s\u001b]+/)) {
      rejectUrl(new Error("Bun exited before it exposed an inspector WebSocket URL"));
    }
  })();
  return { webSocketUrl, finished };
}

function toFileName(url?: string): string {
  if (!url) return "<unknown file>";
  try {
    return url.startsWith("file:") ? fileURLToPath(url) : url;
  } catch {
    return url;
  }
}

function fullName(test: FoundTest, found: Map<number, FoundTest>): string {
  const names: string[] = [];
  let item: FoundTest | undefined = test;
  const seen = new Set<number>();
  while (item && !seen.has(item.id)) {
    seen.add(item.id);
    if (item.name) names.unshift(item.name);
    item = item.parentId === undefined ? undefined : found.get(item.parentId);
  }
  return names.join(" > ") || `<test ${test.id}>`;
}

async function collectTests(webSocketUrl: string, onReady: () => Promise<void>): Promise<TimedTest[]> {
  const found = new Map<number, FoundTest>();
  const completed: TimedTest[] = [];
  const pending = new Map<number, { resolve: () => void; reject: (error: Error) => void }>();
  let nextMessageId = 1;

  await new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    let opened = false;
    let settled = false;
    const fail = (error: Error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };
    const send = (method: string) => new Promise<void>((resolveSend, rejectSend) => {
      const id = nextMessageId++;
      pending.set(id, { resolve: resolveSend, reject: rejectSend });
      socket.send(JSON.stringify({ id, method }));
    });

    socket.addEventListener("open", async () => {
      opened = true;
      try {
        await send("TestReporter.enable");
        await onReady();
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });

    socket.addEventListener("message", (event) => {
      let message: InspectorMessage;
      try {
        message = JSON.parse(String(event.data)) as InspectorMessage;
      } catch {
        fail(new Error("Received a non-JSON inspector message"));
        return;
      }
      if (message.id !== undefined) {
        const request = pending.get(message.id);
        pending.delete(message.id);
        if (!request) return;
        if (message.error) request.reject(new Error(message.error.message ?? "Inspector request failed"));
        else request.resolve();
        return;
      }
      if (message.method === "TestReporter.found") {
        const params = message.params as unknown as FoundTest;
        if (process.env.BUN_TIME_STATS_DEBUG) process.stderr.write(`${message.method} ${JSON.stringify(params)}\n`);
        found.set(params.id, params);
      }
      if (message.method === "TestReporter.end") {
        const { id, elapsed } = message.params as { id: number; elapsed: number };
        const test = found.get(id);
        if (process.env.BUN_TIME_STATS_DEBUG) process.stderr.write(`${message.method} ${JSON.stringify({ id, elapsed, test })}\n`);
        if (test?.type !== "test") return;
        // Bun currently reports this field in nanoseconds, despite protocol docs saying milliseconds.
        completed.push({ name: fullName(test, found), file: toFileName(test.url), durationMs: elapsed / 1_000_000 });
      }
    });

    socket.addEventListener("error", () => fail(new Error("Inspector WebSocket connection failed")));
    socket.addEventListener("close", () => {
      if (!settled) {
        settled = true;
        if (!opened) reject(new Error("Inspector WebSocket closed before connecting"));
        else resolve();
      }
    });
  });

  return completed;
}

async function main(): Promise<number> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(usage());
    return 0;
  }
  const options = parseArgs(process.argv.slice(2));
  let releaseTests!: () => void;
  const reporterReady = new Promise<void>((resolve) => { releaseTests = resolve; });
  const readyServer = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch() {
      await reporterReady;
      return new Response("ready");
    },
  });
  const preloadPath = fileURLToPath(new URL("./wait-for-reporter.ts", import.meta.url));
  const child = Bun.spawn({
    cmd: [
      process.execPath,
      `--inspect=127.0.0.1:${options.port}`,
      options.testArgs[0]!,
      "--preload",
      preloadPath,
      ...options.testArgs.slice(1),
    ],
    env: { ...process.env, BUN_TIME_STATS_READY_URL: `http://127.0.0.1:${readyServer.port}/` },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "pipe",
  });
  const inspector = streamInspectorUrl(child.stderr);

  const testsPromise = inspector.webSocketUrl.then((url) => collectTests(url, async () => {
    releaseTests();
  }));
  let tests: TimedTest[];
  let exitCode: number;
  try {
    [tests, exitCode] = await Promise.all([testsPromise, child.exited]);
  } catch (error) {
    child.kill();
    await inspector.finished;
    throw error;
  } finally {
    readyServer.stop();
  }
  await inspector.finished;
  const stats = createTimingStats(tests, options);
  const output = options.output === "json"
    ? `${JSON.stringify({ schemaVersion: 1, kind: "bun-time-stats", ...stats })}\n`
    : formatTimingStats(stats, !options.outputFile && Boolean(process.stdout.isTTY));

  if (options.outputFile) {
    await mkdir(dirname(options.outputFile), { recursive: true });
    await Bun.write(options.outputFile, output);
  } else {
    process.stdout.write(output);
  }
  return exitCode;
}

main().then((exitCode) => process.exit(exitCode)).catch((error) => {
  process.stderr.write(`bun-time-stats-spike: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
  process.exit(1);
});
