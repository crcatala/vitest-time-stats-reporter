---
id: wcfe-eimh
status: closed
deps: []
links: [wcfe-rogh]
created: 2026-07-21T20:23:18Z
type: feature
priority: 1
assignee: crcatala
parent: wcfe-a4pd
tags: [ci, devops]
---
# Set up GitHub CI workflow

Add .github/workflows/ci.yml that runs on push/PR to main. Jobs: typecheck (tsc --noEmit), test (vitest run), demo (run both demo configs to smoke-test end-to-end), and optionally a 'package integrity' step (npm pack --dry-run). Use ubuntu-latest or ubicloud runners. Pin action versions with hashes. Reference: raindrop-cli .github/workflows/ci.yml structure.

## Acceptance Criteria

CI passes on PR to main — typecheck, tests, demos all run. Actions pinned with commit SHA digests.

