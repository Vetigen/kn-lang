---
name: kn-author
description: Use when user wants to write or extend `.kn` knowledge files. Provides atom shape reference, edge type catalog, common patterns (flow/entity/convention/event), and validation tips. Invokes `knc check --strict` before declaring done.
---

# Authoring Knowledge Atoms

## Workflow

1. **Ask the user:** "Which source file or module should this atom represent?" — get a path.
2. **Read the source** (Read tool) to understand: HTTP endpoints, exported entities, service responsibilities, event publishers.
3. **Suggest atom skeleton** — show the user a draft `.kn` block (see templates below).
4. **User edits** — they fill in domain-specific values.
5. **Validate:** run `knc check --strict --cwd <kn-workspace-or-project-root>` via Bash. Show diagnostics.
6. **Fix and re-validate** until 0 errors.

## Atom Shape Reference

Every atom MUST have a `type` field. Common types and their canonical fields:

### `type: flow` (HTTP endpoint, command handler, user action)

```kn
@<namespace>/<feature> {
  type: flow,
  entry: "POST /api/path",
  permission: "scope.resource.action",
  contract: {
    in: { field: TypeRef },
    out: { field: TypeRef },
    err: ["DOMAIN.ERROR_CODE"]
  },
  invariants: [
    { name: "rule-name", since: "YYYY-MM-DD", reason: "why" }
  ],
  source: "src/path/to/handler.ts",
  freshness: "YYYY-MM-DD"
}
```

### `type: entity` (data model, DB table)

```kn
@<namespace>/<entity> {
  type: entity,
  identity: fp(prefix_),
  storage: "postgres",
  source: "src/path/to/entity.ts",
  freshness: "YYYY-MM-DD"
}
```

### `type: service` (orchestration class, business logic)

```kn
@<namespace>/<service> {
  type: service,
  responsibility: "single sentence",
  source: "src/path/to/service.ts",
  freshness: "YYYY-MM-DD"
}
```

### `type: convention` (cross-cutting rule, pattern)

```kn
@convention/<rule-name> {
  type: convention,
  rule: "Plain-language description of the rule",
  source: "src/path/to/implementation",
  freshness: "YYYY-MM-DD"
}
```

### `type: event` (async message, RabbitMQ payload)

```kn
@event/<event-name> {
  type: event,
  payload: { field: TypeRef },
  source: "contracts/event.proto",
  freshness: "YYYY-MM-DD"
}
```

## Edge Types (Closed List — 8 only)

| Edge | Use When |
|---|---|
| `-uses->` | A consumes B's service/API |
| `-publishes->` | A emits event B |
| `-consumes->` | A listens to event B |
| `-invalidates->` | A invalidates cache/state B |
| `-owned-by->` | A is owned by team/module B |
| `-creates->` | A instantiates B |
| `-revokes->` | A terminates B |
| `-see-also->` | Informational reference |

Custom edge types are NOT allowed in v0.1 (will fail `knc check` with KN2005).

## Syntax Pitfalls (Common Errors)

1. **Field separator is comma, not newline.** `{ a: 1, b: 2 }` ✓. `{ a: 1\n  b: 2 }` ✗.
2. **Dates must be quoted strings.** `freshness: "2026-05-14"` ✓. `freshness: 2026-05-14` ✗ (3 NumberLiterals + 2 Dashes).
3. **Paths must be quoted strings.** `source: "src/auth/login.ts"` ✓. `source: src/auth/login.ts` ✗.
4. **Error codes with dots must be quoted.** `err: ["AUTH.INVALID_CREDENTIALS"]` ✓.
5. **`ref` is a reserved keyword.** Don't use `ref:` as a field key — use `source:` or `link:`.

## Edge Inference Hints

When extracting atoms from code:
- `@Controller` method → atom of type `flow`
- Service calls another service → `-uses->` edge
- `eventEmitter.emit('x')` or proto publisher → `-publishes-> @event/x`
- Queue consumer (`@MessagePattern`, broker subscription) → `-consumes-> @event/x`
- Cache invalidation (`bumpScopeVersion`, `cache.del`) → `-invalidates-> @convention/cache.<ns>`

## After Authoring

Always run validation before declaring done:

```bash
cd <kn-workspace-or-project-root>
knc check --strict
```

If exit 0 and "Found no errors": the atom is valid. Commit alongside source code.

## When NOT to Use This Skill

- User wants to query existing atoms → use `kn-explore` skill instead
- User wants to fix diagnostics → use `kn-validate` skill instead
- User wants automated extraction from a large module → dispatch the `kn-author` agent (subagent_type for this same plugin)
