---
id: wcfe-kpmd
status: open
deps: []
links: []
created: 2026-07-21T20:23:18Z
type: chore
priority: 0
assignee: crcatala
parent: wcfe-a4pd
tags: [publication, release]
---
# Polish npm package metadata

Update package.json with missing metadata fields for npm publication and discoverability: repository (git URL), bugs (issues URL), homepage (GitHub repo URL), engines (minimum Node version, e.g., >=18). Add 'prepublishOnly' script that runs 'npm run verify' to gate publish on typecheck+tests+demos passing. Add npm version badge and license badge to README.md header.

## Acceptance Criteria

package.json has repository, bugs, homepage, engines fields. `npm publish` runs verify first. README has npm/CI badges.

