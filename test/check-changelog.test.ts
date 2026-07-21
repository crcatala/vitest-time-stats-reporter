import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const projectDir = resolve(import.meta.dirname, "..");
const tempDirs: string[] = [];

function runCheck(changelog: string): void {
  const tempDir = mkdtempSync(join(tmpdir(), "check-changelog-"));
  tempDirs.push(tempDir);
  cpSync(join(projectDir, "scripts", "check-changelog.sh"), join(tempDir, "check-changelog.sh"));
  writeFileSync(join(tempDir, "CHANGELOG.md"), changelog);
  execFileSync("bash", ["check-changelog.sh"], { cwd: tempDir, stdio: "pipe" });
}

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) rmSync(tempDir, { recursive: true, force: true });
});

describe("check-changelog.sh", () => {
  it("requires an unreleased list entry, not only a category heading", () => {
    expect(() => runCheck("# Changelog\n\n## [Unreleased]\n\n### Added\n\n## [1.0.0]\n")).toThrow();
  });

  it("accepts an unreleased list entry", () => {
    expect(() =>
      runCheck(
        "# Changelog\n\n## [Unreleased]\n\n### Added\n- A user-visible change\n\n## [1.0.0]\n"
      )
    ).not.toThrow();
  });
});
