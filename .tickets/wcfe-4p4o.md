---
id: wcfe-4p4o
status: open
deps: []
links: []
created: 2026-07-21T20:23:18Z
type: feature
priority: 1
assignee: crcatala
parent: wcfe-a4pd
tags: [release, devops]
---
# Configure release-it for automated releases

Add release-it (npm release tool) with @release-it/keep-a-changelog plugin. Config: git tag/commit messages, GitHub release creation, npm publish with --access public, pre-release hooks (check-changelog.sh + npm run verify), post-bump hook (test:package or equivalent). Also add companion scripts: scripts/check-changelog.sh (blocks release if [Unreleased] is empty) and scripts/prep-release.sh (gathers commits since last tag for changelog drafting). Reference: raindrop-cli .release-it.json and scripts/check-changelog.sh, scripts/prep-release.sh.

## Acceptance Criteria

release-it configured and works in dry-run mode (`npm run release:dry`). check-changelog.sh validates unreleased entries. prep-release.sh gathers commit info.

