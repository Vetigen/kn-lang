# kn-lang

Typed knowledge format for AI assistants. `tsc` for documentation. Two CLIs: `knc` (compiler) and `kn` (query). Pure Bun + TypeScript, zero native deps.

---

## Absolute Rules

- **Don't commit unless asked.** Stage and surface a diff; let the maintainer decide.
- **Don't push, force-push, or delete branches without explicit approval.**
- **Don't skip git hooks** (`--no-verify`, `--no-gpg-sign`) unless explicitly requested.
- **Don't publish to npm** or cut a release tag without explicit approval. Release flow is GitHub Actions on tag push — local `npm publish` is forbidden.
- **Don't add runtime dependencies casually.** Goal is zero native deps and minimal surface. Justify any new dependency in the PR.
- **Don't break the closed lists.** Edge types and atom types are intentionally closed in v0.1 (see `src/stdlib/`). Adding a new edge type or atom type is a breaking change — needs a deliberate version bump and migration note.

---

## Defaults

- Use `TaskCreate` to track multi-step work.
- Run independent reads in parallel — single message, multiple tool calls.
- After any batch edit: `bun run typecheck && bun test`. Both must be green before declaring done.
- TDD: failing test first, then implementation. `tests/` mirrors `src/` structure.
- Files under 300 lines, one responsibility per file.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Bun ≥ 1.1.0 |
| Language | TypeScript (strict, ESM only) |
| Test runner | `bun test` |
| Build | `bun build` → single-file binaries (`bin/knc`, `bin/kn`) |
| Standalone | `bun build --compile` per-platform binaries in `dist/` |
| Dependencies | Zero native, minimal npm (see `package.json`) |

No SQLite, no daemon, no native bindings. The whole CLI is a Bun script.

---

## Architecture — Compilation Pipeline

`.kn` source files flow through a typed pipeline. Each stage is a separate module under `src/`:

```
.kn files
  ↓  src/parser/      — tokenize + parse to CST
  ↓  src/ast/         — typed AST (atoms, edges, fields)
  ↓  src/resolver/    — atom registry, cross-file symbol resolution
  ↓  src/checker/     — semantic validation (refs, edges, freshness, required fields)
  ↓  src/indexer/     — build IndexedKnowledge (in-memory corpus)
  ↓  src/compiler/    — write .kn-dist/ artifacts (manifest.json, atoms.json, edges.json)
  ↓  src/query/       — kn get / ls / tree / search / trace
  ↓  src/output/      — human, json, tree formatters
```

**Two CLI entry points:**

- `src/cli-knc.ts` → `knc` (compiler): `init`, `check`, `build`
- `src/cli-kn.ts` → `kn` (query): `manifest`, `ls`, `tree`, `get`, `search`, `trace`, `why`, `diff`

**Shared infra:**

- `src/stdlib/` — closed lists: edge types, atom types, primitive typerefs (`E164`, `URL`, `timestamptz`, `fp(prefix_)`, etc.)
- `src/errors/` — KN#### code catalog + formatter
- `src/config/` — `kn.config.json` loader and schema

---

## Module Map

| Module | Owns | Touch when... |
|---|---|---|
| `src/parser/` | Tokens, grammar, AST construction | Adding/changing syntax (new field types, new literal forms) |
| `src/ast/` | AST node types, source locations | New AST node kind |
| `src/resolver/` | Atom registry, `@path` lookup | Changing how paths resolve or new namespace rules |
| `src/checker/` | Semantic rules (one file per rule) | Adding a new diagnostic (e.g., new KN#### code) |
| `src/indexer/` | `IndexedKnowledge` (queryable corpus) | Changing the in-memory query surface |
| `src/compiler/` | Dist artifacts, pipeline orchestration | Changing build outputs |
| `src/query/` | Query executor for `kn` commands | New `kn` subcommand |
| `src/output/` | Human/JSON/tree formatters | Changing CLI rendering |
| `src/stdlib/` | Closed lists (edges, types, primitives) | **Rarely** — these are versioned API surface |
| `src/errors/` | KN#### codes, message templates | New diagnostic code |
| `src/config/` | `kn.config.json` schema + loader | New config option |

---

## Conventions

### Atom Paths

`@<namespace>/<feature>` — e.g., `@auth/login`, `@convention/cache.patients`.

- Lowercase, kebab-case for path segments
- `@event/<name>` reserved for events
- `@convention/<name>` reserved for cross-cutting rules
- `@module <name> { type: module }` declares a directory-level module atom

### Edge Types (Closed — 8 only in v0.1)

`uses`, `publishes`, `consumes`, `invalidates`, `owned-by`, `creates`, `revokes`, `see-also`.

Defined in `src/stdlib/edge-types.ts`. Adding a new edge type requires a deliberate version bump and is a breaking change. Unknown edges fail with **KN2005**.

### Atom Types

`flow`, `entity`, `service`, `convention`, `event`, `module`, `decision`.

Every atom MUST have a `type` field (**KN4001** if missing).

### Error Codes (KN####)

Centralized in `src/errors/codes.ts`. Categories:

| Range | Phase | Example |
|---|---|---|
| `KN10xx` | Lexer / Parser | KN1001 unrecognized char, KN1002 unexpected token |
| `KN20xx` | Semantic | KN2001 broken ref, KN2002 duplicate, KN2003 broken edge target, KN2004 type mismatch, KN2005 unknown edge type |
| `KN30xx` | Freshness | KN3001 stale (warn), KN3002 stale (error) |
| `KN40xx` | Required fields | KN4001 missing `type` |

When adding a new diagnostic:
1. Pick the next available code in the right range.
2. Add to `src/errors/codes.ts` with code + message template.
3. Implement the rule in `src/checker/<rule-name>.ts`.
4. Add a test in `tests/checker/<rule-name>.test.ts`.

### TypeScript Style

- `strict: true` always — no `any` unless an inline `// @ts-expect-error` justifies it.
- ESM imports with `.ts` extensions in source (`import { X } from './foo'` — no `.js` suffix; Bun handles it).
- Prefer discriminated unions over `instanceof` chains for AST traversal.
- Files under 300 lines preferred. Split when a file grows past that.

### Commits

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`.
- Single concern per commit. Don't bundle a refactor with a feature.
- Tag releases as `vMAJOR.MINOR.PATCH` (e.g., `v0.1.1`). GitHub Actions publishes on tag.

---

## Commands

```bash
bun install                        # Install deps
bun test                           # Run all tests
bun test tests/checker/            # Run one suite
bun run typecheck                  # tsc --noEmit
bun run build                      # Build bin/knc and bin/kn
bun run build:standalone           # Per-platform compiled binary in dist/
bun run dev:knc -- check --strict  # Run knc from source
bun run dev:kn -- ls               # Run kn from source
```

After local changes, the contract is: `bun test` green AND `bun run typecheck` green. CI runs both; broken main is unacceptable.

---

## Testing

- `tests/` mirrors `src/` one-to-one. New module → new test directory.
- Every public function has at least one happy path and one error case.
- Smoke tests under `tests/smoke/` cover end-to-end CLI invocations against fixture corpora.
- Test descriptions in English, follow `should …` pattern.
- Fixtures live next to the tests that use them.

---

## Plugin Layer (Claude Code)

This repo also ships a Claude Code plugin (skills + agents). Plugin assets live in:

```
.claude-plugin/plugin.json   # Plugin manifest
marketplace.json             # Standalone marketplace (source: ".")
skills/<name>/SKILL.md       # Each skill is a markdown file with YAML frontmatter
agents/<name>.md             # Each agent is a markdown file with YAML frontmatter
```

**These directories MUST NOT land in the npm tarball.** The `files` array in `package.json` is an allowlist (`bin`, `dist`, `README.md`, `LICENSE`) and excludes plugin assets implicitly. After any change to `files` or plugin dirs, verify with:

```bash
npm pack --dry-run 2>&1 | grep -E "\.claude-plugin|skills/|agents/" || echo "EXCLUDED"
```

Expected: `EXCLUDED`.

**Versioning is decoupled:**

- `package.json` version → npm release (CLI)
- `.claude-plugin/plugin.json` version → plugin marketplace release

A CLI-only change bumps `package.json`. A plugin-only change bumps `plugin.json`. A change touching both bumps both.

---

## Configuration (`kn.config.json`)

User-facing config consumed by `knc`. Schema in `src/config/schema.ts`. Common fields:

- `corpus.include` / `corpus.exclude` — glob patterns
- `freshness.warnAfterDays` (default 90) / `freshness.errorAfterDays` (default 365)
- `output.dir` (default `.kn-dist/`)

When adding a config option:
1. Update `src/config/schema.ts`.
2. Update the loader in `src/config/loader.ts`.
3. Add a default in `knc init` template.
4. Document in README (and AUTHORING.md if user-facing).

---

## Release Flow

1. `bun test && bun run typecheck` green
2. Update `CHANGELOG.md` with the new version section above the previous one
3. Bump `package.json` version (and `.claude-plugin/plugin.json` if plugin changed)
4. Commit: `chore: release vX.Y.Z`
5. `git tag -a vX.Y.Z -m "vX.Y.Z — <summary>"`
6. `git push origin main && git push origin vX.Y.Z`
7. GitHub Actions builds binaries, creates Release, publishes to npm

Never `npm publish` locally. CI owns the publish step (NPM_TOKEN secret).

---

## Common Pitfalls

- **Dates / paths / dotted error codes inside `.kn` MUST be quoted strings.** `freshness: 2026-05-14` is lexer garbage; use `freshness: "2026-05-14"`.
- **Field separator inside `{}` is comma.** Newlines alone don't delimit fields.
- **`ref:` is reserved.** Don't use it as a field key. Use `source:` or `link:`.
- **Custom edge types fail KN2005.** Stick to the closed list of 8.
- **Cross-platform standalone builds** require running `bun build --compile --target=<platform>` on a runner matching the target — don't try to cross-compile from a laptop without matrixing CI.

---

## When in Doubt

- Code style → `CONTRIBUTING.md`
- Conduct → `CODE_OF_CONDUCT.md`
- Authoring `.kn` files → README + plugin's `skills/kn-author/SKILL.md`
- Error code meanings → `src/errors/codes.ts` + plugin's `skills/kn-validate/SKILL.md`
- The format itself → README "Why" + "Features" sections
