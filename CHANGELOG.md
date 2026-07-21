# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Biome formatter configuration and format-check CI job (replaces Prettier)
- Renovate dependency automation configuration
- `format` and `format:check` npm scripts
- Format check is part of `npm run verify` and runs in CI

### Changed
- All source files reformatted with Biome (style: space, 2-space indent, double quotes, semicolons, es5 trailing commas, 100 char line width)

### Infrastructure
- GitHub repo description and topics set for discoverability

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
