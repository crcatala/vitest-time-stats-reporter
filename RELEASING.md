# Releasing

This project uses [release-it](https://github.com/release-it/release-it) with the
[`@release-it/keep-a-changelog`](https://github.com/release-it/keep-a-changelog) plugin
to automate version bumps, changelog management, git tagging, GitHub releases, and npm publishing.

## Prerequisites

- Push access to `crcatala/vitest-time-stats-reporter`.
- A clean checkout on `main` with no uncommitted changes.
- An npm account with publish access to the `@crcatala` scope (`npm whoami`).
- A GitHub token available as `GITHUB_TOKEN` with repository **Contents: read and write**
  permission, so release-it can create the GitHub Release. Alternatively, authenticate
  with `gh auth login`.
- Node.js 22.21+ or 24+.

The package is public and is published as `vitest-time-stats-reporter`.

## Before releasing

1. Pull the current main branch:

   ```bash
   git checkout main
   git pull --ff-only
   ```

2. Prepare and update the changelog. The helper lists changes since the last tag:

   ```bash
   npm run release:prep
   ```

   Review the output and add user-facing entries beneath `## [Unreleased]` in
   `CHANGELOG.md`, using [Keep a Changelog](https://keepachangelog.com/) sections
   such as Added, Changed, Fixed, Removed, or Security.

3. Run the complete local verification suite:

   ```bash
   npm run verify
   ```

   This runs type checking, unit tests, and demo smoke tests. The release command
   will also run verification automatically, but it's good to catch issues early.

## Release

Preview the local release steps first:

```bash
GITHUB_TOKEN=ghp_...   # if not already configured
npm run release:dry
```

`release:dry` deliberately disables the npm and GitHub integrations, so it cannot
publish or open GitHub's release form. Run `release` for the full process.

Then release interactively:

```bash
npm run release
```

Release-it prompts for the version bump and then:

1. **Validates** the clean `main` checkout and runs `npm run verify`.
2. **Bumps** `package.json` and moves the changelog's Unreleased entries into the
   new version with today's date.
3. **Builds** the project and verifies every export target is present and loadable
   in the packed tarball.
4. **Commits** the changes (`chore: release v<version>`).
5. **Tags** the commit (`v<version>`).
6. **Pushes** the commit and tag to GitHub.
7. **Creates** a GitHub Release using the changelog notes.
8. **Publishes** `vitest-time-stats-reporter` publicly to npm.

To specify the version explicitly without the prompt:

```bash
npx release-it minor       # 0.2.0
npx release-it major       # 1.0.0
npx release-it patch       # 0.1.1
npx release-it -- 0.1.2    # exact version
```

### Recovery options

If a partial release succeeds but a later step fails (e.g. npm publish succeeds
but the GitHub Release creation times out), skip the completed steps:

```bash
# Skip npm publishing if it already succeeded
npm run release -- --no-npm

# Skip GitHub Release creation
npm run release -- --no-github

# Both
npm run release -- --no-npm --no-github
```

### Prereleases

```bash
npx release-it --preRelease=alpha
npx release-it --preRelease=beta
npx release-it --preRelease=rc
```

Each prerelease increments the prerelease number automatically.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Given that it is
a developer tool (Vitest reporter), breaking changes include:

- Removal or rename of exported APIs
- Changes to the JSON output schema
- Changes to option names or semantics
- Dropping support for a Node.js or Vitest version

## Verify the release

```bash
npm view vitest-time-stats-reporter
npm view vitest-time-stats-reporter versions --json
```

Check the release is live on:

- [npm](https://www.npmjs.com/package/vitest-time-stats-reporter)
- [GitHub Releases](https://github.com/crcatala/vitest-time-stats-reporter/releases)

Published npm versions are immutable. If a release has a defect, publish a
corrective patch version rather than replacing the existing one.