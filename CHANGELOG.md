# Changelog

## [Unreleased][unreleased]

## [3.0.0] - 2018-05-22

### Added

- Add node 9 and 10 to Travis ([**@vweevers**](https://github.com/vweevers), [**@ralphtheninja**](https://github.com/ralphtheninja))

### Changed

- Upgrade `abstract-leveldown` to `5.0.0` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Upgrade `standard` to `11.0.0` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Tweak readme ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Use `airtap` instead of `zuul` ([**@vweevers**](https://github.com/vweevers))
- Switch to plain MIT license ([**@vweevers**](https://github.com/vweevers))

### Removed

- Remove TypeScript typings ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Remove TypeScript tests ([**@vweevers**](https://github.com/vweevers))
- Remove node 4 from Travis ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Remove deprecated JWT addon from Travis ([**@vweevers**](https://github.com/vweevers))
- Remove obsolete `--stderr` flag ([**@vweevers**](https://github.com/vweevers))

## [2.0.0] - 2018-02-11

### Added

- Run test suite with TypeScript in addition to Node.js ([**@vweevers**](https://github.com/vweevers))
- Add `UPGRADING.md` ([**@vweevers**](https://github.com/vweevers))
- Add `CHANGELOG.md` ([**@vweevers**](https://github.com/vweevers))
- README: explain types and snapshot guarantees ([**@vweevers**](https://github.com/vweevers))
- README: add level badge ([**@ralphtheninja**](https://github.com/ralphtheninja))
- README: add node version badge ([**@ralphtheninja**](https://github.com/ralphtheninja))

### Changed

- Update `abstract-leveldown` to 4.0.0 ([**@vweevers**](https://github.com/vweevers))
- Perform serialization through idiomatic `_serializeKey` and `_serializeValue` ([**@vweevers**](https://github.com/vweevers))
- Don't stringify anything except nullish values ([**@vweevers**](https://github.com/vweevers))
- Use `Buffer.isBuffer()` instead of `AbstractLevelDOWN#isBuffer` ([**@vweevers**](https://github.com/vweevers))
- README: update instantiation instructions for latest `levelup` ([**@kumavis**](https://github.com/kumavis))
- README: rename "database" to "store" ([**@ralphtheninja**](https://github.com/ralphtheninja))
- README: simplify example and prefer ES6 ([**@vweevers**](https://github.com/vweevers))
- Configure Greenkeeper to ignore updates to `@types/node` ([**@ralphtheninja**](https://github.com/ralphtheninja))

### Fixed

- Don't clone `Buffer` in iterator ([**@vweevers**](https://github.com/vweevers))
- Stringify `Buffer.from()` argument in iterator ([**@vweevers**](https://github.com/vweevers))
- README: use SVG rather than PNG badge for Travis ([**@ralphtheninja**](https://github.com/ralphtheninja))
- README: link to `abstract-leveldown` ([**@vweevers**](https://github.com/vweevers))
- README: normalize markdown headers ([**@ralphtheninja**](https://github.com/ralphtheninja))
- README: fix license typos ([**@ralphtheninja**](https://github.com/ralphtheninja))
- README: fix code example ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Rename `iterator#_end` to fix conflict with `abstract-leveldown` ([**@vweevers**](https://github.com/vweevers))
- Set `zuul --concurrency` to 1 to avoid hitting Sauce Labs limit ([**@vweevers**](https://github.com/vweevers))
- Test on Android 6.0 instead of latest (7.1) due to Sauce Labs issue ([**@vweevers**](https://github.com/vweevers))

### Removed

- Remove global store ([**@vweevers**](https://github.com/vweevers))
- Remove skipping of falsy elements in `MemDOWN#batch` ([**@vweevers**](https://github.com/vweevers))
- Remove obsolete benchmarks ([**@vweevers**](https://github.com/vweevers))
- Remove obsolete `testBuffer` from `test.js` ([**@vweevers**](https://github.com/vweevers))
- Remove redundant `testCommon` parameter from most tests ([**@vweevers**](https://github.com/vweevers))
- Remove unnecessary `rimraf` replacement for Browserify ([**@vweevers**](https://github.com/vweevers))
- README: remove Greenkeeper badge ([**@ralphtheninja**](https://github.com/ralphtheninja))

[unreleased]: https://github.com/level/memdown/compare/v3.0.0...HEAD

[3.0.0]: https://github.com/level/memdown/compare/v2.0.0...v3.0.0

[2.0.0]: https://github.com/level/memdown/compare/v1.4.1...v2.0.0
