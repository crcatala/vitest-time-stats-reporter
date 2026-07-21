---
id: wcfe-3k07
status: closed
deps: []
links: []
created: 2026-07-21T20:23:18Z
type: task
priority: 2
assignee: crcatala
parent: wcfe-a4pd
tags: [formatting, tooling]
closed: 2026-07-21T22:22:00Z
---
# Add Biome config and format checking

Added biome.json configuration (semicolons: always, quoteStyle: double, indentWidth: 2, indentStyle: space, trailingCommas: es5, lineWidth: 100). Added format and format:check npm scripts. Added format check job to CI workflow. Format check is also part of npm run verify.

## Acceptance Criteria

`biome.json` at repo root. `npm run format:check` passes on current codebase. CI includes format check step. ✅
