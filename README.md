# KN — Knowledge Notation

> Typed knowledge format for AI assistants. Like `tsc` for documentation.

Stop making AI read 500 lines of Markdown to understand one thing.

## Install

```bash
bun install -g kn-lang
```

Or download standalone binaries from [Releases](https://github.com/kn-lang/kn/releases).

## Quick Start

```bash
knc init                       # scaffold kn.config.json + AUTHORING.md + _examples
echo '@hello/world { type: flow }' > knowledge/hello.kn
knc build                      # validate + write .kn-dist/
kn get @hello/world            # query
```

## Discovery

When you don't know the atom path yet:

```bash
kn ls                          # flat list of all atoms
kn tree                        # hierarchical tree view
kn tree @auth                  # subtree
kn search "refresh"            # regex match across paths and field values
kn manifest                    # full corpus summary (JSON, AI session payload)
```

## Why

Markdown is great for humans, costly for AI. Every CLAUDE.md, KNOWLEDGE.md, and ARCHITECTURE.md asks the model to scan thousands of tokens to answer one question.

KN gives knowledge a typed structure:

```
@auth/login {
  type: flow,
  contract: { in: { phone: E164 }, out: { jwt: "string" } },
  invariants: [
    { name: "max-active", since: "2025-11-03", reason: "incident" }
  ],
  source: "src/auth/login.ts"
}

@auth/login -creates-> @auth/session
```

Now an AI can ask:

```bash
$ kn get @auth/login --depth 1 --json
{ "atoms": [...], "edges": [...] }   # 200 tokens, surgical
```

## Features

- **Typed atoms** with edges forming a knowledge graph
- **Pinpoint retrieval** — `@path` addressing
- **Discovery built-in** — `kn ls`, `kn tree`, `kn search`, `kn manifest` for zero-context exploration
- **Compile-time validation** — broken refs, duplicates, freshness
- **TypeScript-style errors** with KN#### codes
- **Zero native deps** — pure Bun/TS, no SQLite, no daemon
- **Standalone binaries** — drop and run, Bun not required

## Status

`0.1.0` — MVP. Core format and CLI stable. v0.2 will add MCP + LSP.

## License

MIT
