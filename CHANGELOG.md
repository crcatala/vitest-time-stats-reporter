# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- MIT LICENSE file
- npm package metadata (`repository`, `bugs`, `homepage`, `engines`, `publishConfig`) for public registry publishing
- `CONTRIBUTING.md` with contribution guidelines, bug report instructions, and local dev setup
- `RELEASING.md` with release workflow and versioning documentation (#4)
- `format` and `format:check` npm scripts using Biome formatter
- Configurable execution-time histogram with customisable bin width
- Test count and total test execution time summary
- Percentile reporting: p50, p90, p99, and max
- Ranked slowest test cases (configurable count)
- Slow-test concentration metrics (count/percentage above threshold, share of execution time)
- Compact JSON output with versioned schema (`output: 'json'`)
- File output support via `outputFile` option
- Zero runtime dependencies
- TypeScript-first with full type exports

### Changed

- README rewritten with install, usage, options, and development sections
