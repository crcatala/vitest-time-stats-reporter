---
id: wcfe-vahm
status: open
deps: []
links: []
created: 2026-07-21T20:23:18Z
type: chore
priority: 3
assignee: crcatala
parent: wcfe-a4pd
tags: [publication, devops]
---
# Set GitHub repo description and topics

The GitHub repo currently has no description and no topics. Before making public, set a good description and relevant topics for discoverability: vitest, reporter, testing, performance, histogram, timing. Description should match or refine the npm description.

## Acceptance Criteria

GitHub repo has description and topics set via `gh repo edit` or GH UI.

## Status

Cannot set from CLI: the current GitHub token lacks repository admin access (same issue as wcfe-rogh). Setting requires GH UI by a user with admin access on the repo.

**Suggested GH UI values:**
- Description: `An additive Vitest reporter that shows test execution-time distribution — histogram, percentiles, and slow-test concentration`
- Topics: `vitest`, `reporter`, `testing`, `performance`, `histogram`, `timing`
