---
id: wcfe-rogh
status: open
deps: []
links: [wcfe-eimh]
created: 2026-07-21T20:57:58Z
type: task
priority: 1
assignee: cc-vps
parent: wcfe-a4pd
tags: [ci, security, repository-settings]
---
# Configure main branch protection for CI and Code Owner review

Repository branch protection cannot be configured from this checkout: the GitHub API returned 404, indicating this credential lacks repository-admin access. Track the required out-of-band setting.

## Acceptance Criteria

main requires one approving pull-request review including Code Owner review; stale approvals are dismissed; conversation resolution is required; and the five named CI checks are required and up to date.

