---
id: wcfe-a80d
status: closed
deps: []
links: []
created: 2026-07-21T20:23:18Z
type: chore
priority: 2
assignee: crcatala
parent: wcfe-a4pd
tags: [tooling, config]
---
# Expand .gitignore with common entries

The current .gitignore only has node_modules/, reports/, and *.tsbuildinfo. Add common entries: coverage/, .DS_Store, Thumbs.db, .env, .env.local, .env.*.local, *.log, npm-debug.log*, .idea/, .vscode/, *.swp, *.swo. Reference: raindrop-cli .gitignore.

## Acceptance Criteria

Updated .gitignore covers common OSS project artifacts (coverage, IDE, OS, env, logs, cache)

