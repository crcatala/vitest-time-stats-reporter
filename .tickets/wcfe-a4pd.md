---
id: wcfe-a4pd
status: open
deps: []
links: []
created: 2026-07-21T20:22:20Z
type: epic
priority: 1
assignee: crcatala
---
# Publish-readiness audit

Complete audit of the vitest-time-stats-reporter repo to prepare for public release and npm publishing. Covers licensing, CI, release pipeline, contributing docs, formatting/linting, repo metadata, and dependency automation.

## Design

Reference: raindrop-cli OSS conventions (https://github.com/crcatala/raindrop-cli)

## Acceptance Criteria

1. LICENSE file committed\n2. CHANGELOG.md with Keep a Changelog format\n3. GitHub CI workflow (typecheck + test + demos)\n4. release-it + @release-it/keep-a-changelog configured\n5. CONTRIBUTING.md in place\n6. renovate.json for automated deps\n7. Prettier config + format check\n8. .gitignore expanded\n9. npm package metadata complete\n10. GitHub repo description + topics set

