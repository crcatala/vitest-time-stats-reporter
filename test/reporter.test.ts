import { afterEach, describe, expect, it, vi } from "vitest";
import type { TestModule } from "vitest/node";
import TimeStatsReporter from "../src/reporter.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TimeStatsReporter", () => {
  it("falls back to moduleId when older Vitest modules lack relativeModuleId", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const olderVitestModule = {
      moduleId: "/workspace/fixture.test.ts",
      children: {
        allTests: () => [
          {
            fullName: "suite > test",
            diagnostic: () => ({ duration: 100 }),
          },
        ],
      },
    } as unknown as TestModule;

    new TimeStatsReporter().onTestRunEnd([olderVitestModule]);

    expect(write).toHaveBeenCalledWith(
      expect.stringContaining("/workspace/fixture.test.ts > suite > test")
    );
  });
});
