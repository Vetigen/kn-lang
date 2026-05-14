---
name: kn-explore
description: Use at the start of a Claude session when the project has `.kn` knowledge files, OR when the user asks "what atoms exist?", "show me the knowledge map", or "what's documented in this codebase?". Runs `kn manifest`, `kn ls`, `kn tree` to load the corpus shape into context with minimal token cost.
---

# Exploring the Knowledge Corpus

## Workflow

1. **Detect the corpus root.** Look for `kn.config.json` upward from cwd, OR a `kn-workspace/` directory at the repo root. Set `CORPUS_DIR=<path>`.
2. **Load the manifest** (full corpus summary, ~200 tokens for 50 atoms):

```bash
cd $CORPUS_DIR
kn manifest
```

This returns JSON: `{ version, builtAt, atoms: { "@path": { type, summary, freshness, scope? } }, namespaces, typeCounts, edgeCount }`.

3. **Optional: flat atom list** (if user wants a glance):

```bash
kn ls
```

4. **Optional: subtree exploration** (when user names a namespace):

```bash
kn tree @<namespace>
```

5. **Pinpoint retrieval** (when user asks about a specific module):

```bash
kn get @<path> --depth 1
```

`--depth 1` includes 1-hop neighbors (in + out edges) for full context.

## When to Use Each Command

| User asks... | Run... |
|---|---|
| "What's in this codebase?" | `kn manifest` |
| "Show me all atoms" | `kn ls` |
| "What's under auth?" | `kn tree @auth` |
| "Search for X" | `kn search "X"` |
| "Tell me about @auth/login" | `kn get @auth/login` |
| "How does X relate to Y?" | `kn trace @x @y` |
| "Why does this rule exist?" | `kn why "@atom#invariant-name"` |
| "What changed since X?" | `kn diff --since YYYY-MM-DD` |

## JSON Output for Programmatic Use

Append `--json` to any command for machine-readable output. Parse with `JSON.parse`.

```bash
kn get @auth/login --depth 1 --json
```

## When NOT to Use This Skill

- User wants to write a new atom → use `kn-author` skill
- User wants to check validity → use `kn-validate` skill
- Repo has no `.kn` files and no `kn.config.json` → tell the user there's no corpus; offer to bootstrap with `knc init`
