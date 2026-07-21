---
id: wcfe-3k07
status: open
deps: []
links: []
created: 2026-07-21T20:23:18Z
type: task
priority: 2
assignee: crcatala
parent: wcfe-a4pd
tags: [formatting, tooling]
---
# Add Prettier config and format checking

Add .prettierrc configuration file (semi: true, singleQuote: false, tabWidth: 2, trailingComma: es5, printWidth: 100 — matching raindrop-cli conventions). Update CI workflow to include a format check step. Optionally add a 'format' script to package.json.

## Acceptance Criteria

.prettierrc at repo root. `npx prettier --check src/` passes on current codebase.

