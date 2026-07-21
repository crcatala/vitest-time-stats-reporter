---
id: wcfe-uvmx
status: open
deps: []
links: []
created: 2026-07-21T20:23:18Z
type: task
priority: 2
assignee: crcatala
parent: wcfe-a4pd
tags: [dependencies, devops]
---
# Add renovate.json for dependency automation

Add Renovate config to automate dependency update PRs. Configuration should: extend config:recommended, use semantic commits, run weekly schedule, group minor/patch updates, exclude core deps (typescript, vitest) from auto-grouping, enable lock file maintenance, enable OSV vulnerability alerts, set 7-day minimum release age. Reference: raindrop-cli renovate.json.

## Acceptance Criteria

renovate.json at repo root. When enabled on GH, Renovate opens dependency PRs on the configured schedule.

