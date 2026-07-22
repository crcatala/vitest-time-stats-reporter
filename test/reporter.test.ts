import { relative, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TestModule } from "vitest/node";
import TimeStatsReporter from "../src/reporter.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TimeStatsReporter", () => {
  const projectRoot = resolve("project");
  const moduleId = resolve(projectRoot, "tests", "fixture.test.ts").replaceAll("\\", "/");
  const olderVitestModule = {
    relativeModuleId: undefined,
    moduleId,
    children: {
      allTests: () => [
        {
          fullName: "suite > test",
          diagnostic: () => ({ duration: 100 }),
        },
      ],
    },
  } as unknown as TestModule;

  it("relativizes an absolute moduleId against the project root when relativeModuleId is absent", () => {
    vi.spyOn(process, "cwd").mockReturnValue(projectRoot);
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    new TimeStatsReporter().onTestRunEnd([olderVitestModule]);

    const output = write.mock.calls[0]?.[0] as string;
    const relativeModuleId = relative(projectRoot, moduleId);
    expect(output).toContain(`${relativeModuleId} > suite > test`);
    expect(output).not.toContain(moduleId);
  });

  it("preserves relativeModuleId when present and does not re-relativize", () => {
    vi.spyOn(process, "cwd").mockReturnValue("/project");
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const mod = {
      relativeModuleId: "src/fixture.test.ts",
      moduleId: "/project/src/fixture.test.ts",
      children: {
        allTests: () => [
          {
            fullName: "suite > test",
            diagnostic: () => ({ duration: 100 }),
          },
        ],
      },
    } as unknown as TestModule;

    new TimeStatsReporter().onTestRunEnd([mod]);

    const output = write.mock.calls[0]?.[0] as string;
    expect(output).toContain("src/fixture.test.ts > suite > test");
  });

  it("applies path relativization in JSON output as well", () => {
    vi.spyOn(process, "cwd").mockReturnValue(projectRoot);
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    new TimeStatsReporter({ output: "json" }).onTestRunEnd([olderVitestModule]);

    const output = write.mock.calls[0]?.[0] as string;
    const json = JSON.parse(output);
    expect(json.slowest[0].file).toBe(relative(projectRoot, moduleId));
    expect(json.slowest[0].file).not.toBe(moduleId);
  });

  it("passes custom histogram characters to text output", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    new TimeStatsReporter({ histogramFillChar: "#", histogramEmptyChar: "-" }).onTestRunEnd([
      olderVitestModule,
    ]);

    expect(write).toHaveBeenCalledWith(expect.stringContaining("#".repeat(30)));
  });
});
