---
name: kn-validate
description: Use when the user wants to validate `.kn` files, before committing knowledge changes, or to interpret a KN#### diagnostic. Runs `knc check --strict`, reads the output, explains errors in plain language, and suggests fixes. Useful as a pre-commit check.
---

# Validating Knowledge Files

## Workflow

1. **Find the corpus root** (directory with `kn.config.json`).
2. **Run validation:**

```bash
cd <corpus-root>
knc check --strict
```

3. **Read the diagnostics.** Each line follows the format:

```
file:line:col - error KN####: message
```

4. **Explain each error** to the user in plain language using the code reference below.
5. **Suggest a fix** specific to each error.

## KN#### Code Reference

| Code | Meaning | Common Fix |
|---|---|---|
| **KN1001** | Lexer error (unrecognized character or token) | Check for unquoted special chars (e.g., dates `2026-05-14` → `"2026-05-14"`, paths `src/x` → `"src/x"`) |
| **KN1002** | Parser error (unexpected token) | Missing comma between fields, missing brace, or invalid field key (e.g., `ref:` is reserved — use `source:`) |
| **KN2001** | Broken reference (`ref(@x)` but `@x` not declared) | Either declare `@x`, fix the path typo, or remove the ref |
| **KN2002** | Duplicate atom (`@x` defined twice) | Pick one definition. Check both source files |
| **KN2003** | Broken edge target (`-x-> @y` but `@y` not declared) | Declare `@y` or fix typo |
| **KN2004** | Type mismatch (unknown typeref name) | Use a known stdlib type: `E164`, `Scope`, `timestamptz`, `fp`, `AtomPath`, `URL`, `EnumString` |
| **KN2005** | Unknown edge type | Use one of: `uses`, `publishes`, `consumes`, `invalidates`, `owned-by`, `creates`, `revokes`, `see-also` |
| **KN3001** | Freshness > warnAfterDays (default 90) — warning | Update `freshness: "YYYY-MM-DD"` after reviewing the atom for accuracy |
| **KN3002** | Freshness > errorAfterDays (default 365) — error | Same as KN3001 — the atom is too stale; review and refresh |
| **KN4001** | Missing required field `type` | Add `type: flow | entity | service | convention | event | module | decision` |

## Strict Mode

`--strict` flag escalates ALL warnings to errors. Without `--strict`, KN3001 (freshness warning) doesn't fail the run. Use `--strict` in CI and pre-commit.

## Exit Codes

- `0`: No errors (clean)
- `1`: At least one error
- `2`: CLI error (config missing, file unreadable)

## Output Interpretation Tips

- "Found no errors in 0 files" — slightly misleading copy. If no diagnostics fire, the file count says 0 regardless of how many were processed. Look at exit code (0 = pass).
- Lexer errors (`KN10xx`) are usually about unquoted scalars (dates, paths, dotted error codes).
- Semantic errors (`KN20xx`) point to missing/mistyped atom paths — `kn ls` to see what exists.

## After Fixing

Re-run `knc check --strict`. If 0 errors, commit. Suggest the user run `knc build` to update `.kn-dist/` artifacts if they're tracked in git.

## When NOT to Use This Skill

- User wants to write a new atom → use `kn-author`
- User wants to explore atoms → use `kn-explore`
- No `kn.config.json` exists → suggest `knc init` first
