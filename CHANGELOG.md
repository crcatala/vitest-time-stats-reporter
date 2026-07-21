# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- CONTRIBUTING.md with contribution guidelines and local development instructions
- CHANGELOG.md with Keep a Changelog format
- GitHub CI workflow (typecheck + test + demo smoke tests on push/PR)
- release-it configuration and scripts (check-changelog.sh, prep-release.sh)
- LICENSE file (MIT)
- CODEOWNERS for GitHub Actions workflow protection
- npm package metadata (repository, bugs, homepage, engines, publishConfig)
- prepublishOnly script to gate release on verification passing

## [0.1.0] - 2026-01-09

### Added
- Configurable execution-time histogram with customisable bin width
- Test count and total test execution time summary
- Percentile reporting: p50, p90, p99, and max
- Ranked slowest test cases (configurable count)
- Slow-test concentration metrics (count/percentage above threshold, share of execution time)
- Compact JSON output with versioned schema (`output: 'json'`)
- File output support via `outputFile` option
- Zero runtime dependencies
- TypeScript-first with full type exports
