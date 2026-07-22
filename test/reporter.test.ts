import { afterEach, describe, expect, it, vi } from "vitest";
import type { TestModule } from "vitest/node";
import TimeStatsReporter from "../src/reporter.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TimeStatsReporter", () => {
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

  it("falls back to moduleId when older Vitest modules lack relativeModuleId", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    new TimeStatsReporter().onTestRunEnd([olderVitestModule]);

    expect(write).toHaveBeenCalledWith(
      expect.stringContaining("/workspace/fixture.test.ts > suite > test")
    );
  });

  it("passes custom histogram characters to text output", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    new TimeStatsReporter({ histogramFillChar: "#", histogramEmptyChar: "-" }).onTestRunEnd([
      olderVitestModule,
    ]);

    expect(write).toHaveBeenCalledWith(expect.stringContaining("#".repeat(30)));
  });
});
