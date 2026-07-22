# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- `histogramFillChar` and `histogramEmptyChar` options for customizing histogram bar characters, with sensible fallbacks to defaults (█ and ·) (#7)

### Fixed
- Histogram bar characters are now properly validated; empty-string values fall back to defaults instead of producing broken output (#7)

## [0.1.1] - 2026-07-22

### Added

- ANSI styling and aligned percentile table for terminal reports
- `histogramBins` option; defaults to collapsing runs of empty bins and supports `'all'`

### Changed

- Added visual spacing, a slow-test count badge, wider histogram bars, and severity colors to terminal output

### Fixed

- Handle undefined `module.relativeModuleId` in Vitest versions before v4; fall back to absolute file path (#5)
## [0.1.0] - 2026-07-21

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
- Minimal runtime dependency footprint
- TypeScript-first with full type exports

### Changed

- README rewritten with install, usage, options, and development sections
