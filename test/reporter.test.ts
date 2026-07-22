import { afterEach, describe, expect, it, vi } from "vitest";
import type { TestModule } from "vitest/node";
import TimeStatsReporter from "../src/reporter.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TimeStatsReporter", () => {
  it("relativizes absolute moduleId against the project root when relativeModuleId is absent", () => {
    vi.spyOn(process, "cwd").mockReturnValue("/project");
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const mod = {
      relativeModuleId: undefined,
      moduleId: "/project/tests/fixture.test.ts",
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
    // The absolute path /project/tests/fixture.test.ts should be relativized to
    // tests/fixture.test.ts in the slowest-tests display.
    expect(output).toContain("tests/fixture.test.ts > suite > test");
    expect(output).not.toContain("/project/tests/fixture.test.ts");
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
    vi.spyOn(process, "cwd").mockReturnValue("/project");
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const mod = {
      relativeModuleId: undefined,
      moduleId: "/project/tests/fixture.test.ts",
      children: {
        allTests: () => [
          {
            fullName: "suite > test",
            diagnostic: () => ({ duration: 100 }),
          },
        ],
      },
    } as unknown as TestModule;

    new TimeStatsReporter({ output: "json" }).onTestRunEnd([mod]);

    const output = write.mock.calls[0]?.[0] as string;
    const json = JSON.parse(output);
    expect(json.slowest[0].file).toBe("tests/fixture.test.ts");
    expect(json.slowest[0].file).not.toBe("/project/tests/fixture.test.ts");
  });
});
