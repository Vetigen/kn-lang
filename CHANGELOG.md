# Changelog

## [0.1.1] - 2026-05-14

### Added
- Claude Code plugin (`.claude-plugin/plugin.json`) with 3 skills + 1 agent
- Standalone marketplace (`marketplace.json`) — install via `/plugin marketplace add Vetigen/kn-lang`
- Skill `kn-author` — atom authoring guide (shape reference, edge catalog, syntax pitfalls)
- Skill `kn-explore` — corpus exploration via `kn manifest` / `ls` / `tree`
- Skill `kn-validate` — diagnostic interpretation and fix suggestions
- Agent `kn-author` — automated atom extraction from a code module

### Changed
- README adds "Claude Code Plugin" section

## [0.1.0] - 2026-05-14

### Added
- Initial release
- `.kn` format: atoms, edges, modules, values
- `knc` compiler: init, build, check, watch
- `knc init` scaffolds `AUTHORING.md` and `knowledge/_examples/`
- `kn` query CLI: get, trace, why, diff
- `kn` discovery CLI: ls, tree, search, manifest
- TypeScript-style error formatter (KN#### codes)
- JSON dist output
