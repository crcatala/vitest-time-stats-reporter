import { describe, expect, test } from "bun:test";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("timing fixture", () => {
  test("fast", async () => {
    await sleep(10);
    expect(true).toBe(true);
  });

  test("slow", async () => {
    await sleep(80);
    expect(true).toBe(true);
  });
});
