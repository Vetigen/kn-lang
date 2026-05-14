# Contributing

Thanks for your interest!

## Development

```bash
git clone https://github.com/Vetigen/kn-lang.git
cd kn-lang
bun install
bun test
```

## TDD

Every change has a test. Write the failing test first, then the implementation. See `docs/plans/kn/plan.md` for the full TDD plan used to build v0.1.

## Code Style

- TypeScript strict mode
- ESM only
- Files under 300 lines preferred
- One responsibility per file

## Pull Requests

1. Fork, branch from `main`
2. `bun test` and `bun run typecheck` pass
3. `bun test` covers your change
4. Conventional commits (`feat:`, `fix:`, `chore:`)
5. Reference an issue or open one first for significant changes

## Code of Conduct

This project follows [Contributor Covenant 2.1](CODE_OF_CONDUCT.md).
