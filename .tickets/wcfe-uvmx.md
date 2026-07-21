---
id: wcfe-uvmx
status: closed
deps: []
links: []
created: 2026-07-21T20:23:18Z
type: task
priority: 2
assignee: crcatala
parent: wcfe-a4pd
tags: [dependencies, devops]
closed: 2026-07-21T22:22:00Z
---
# Add renovate.json for dependency automation

Added renovate.json with config:recommended base, weekly schedule, semantic commits, grouped minor/patch updates, excluded core deps (typescript, vitest) from auto-grouping, lock file maintenance, OSV vulnerability alerts, 7-day minimum release age.

## Acceptance Criteria

renovate.json at repo root. When enabled on GH, Renovate opens dependency PRs on the configured schedule. ✅
