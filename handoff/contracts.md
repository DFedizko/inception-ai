# Frozen contracts — DO NOT CHANGE

These artifacts are **frozen** in Phase 0 so that the two parallel agents (see `agent-studio.md` and `conversation-tree.md`) never collide on a shared definition. Treat everything here as read-only. If you believe a contract is wrong, **stop and raise it** — do not edit it unilaterally.

## 1. Versioning kernel (shared) — `src/bounded-contexts/shared/versioning/`

The generic "git" engine. Pure graph algorithms, no domain meaning. Already implemented, tested (12 green), benchmarked.

- `RevisionTree<T>` — immutable rooted tree with O(1) lookups. Methods: `empty()`, `root(id, payload)`, `branchFrom(parentId, id, payload)`, `has`, `size`, `revision`, `childrenOf`, `parentOf`, `lineageOf`, `commonAncestorOf`, `divergenceOf` (the diff primitive), `leaves`, `branches`.
- `Revision<T>` — `id`, `parentId`, `payload`, `isRoot()`.
- `Divergence<T>` — `{ commonAncestor, left, right }` (the two diverging paths below the common ancestor).

**Both contexts build their versioning ON TOP of this.** Do not reimplement graph logic. Map your domain payload into `T`.

## 2. Published Language — `src/bounded-contexts/agent/published/agent-version-snapshot.ts`

The one shape that crosses the boundary between **Agent Studio (upstream)** and **Conversation (downstream)**. Frozen.

```ts
AgentVersionSnapshot = {
  agentId: string;
  versionNumber: number;   // v1, v2… auto-incremented
  versionName: string;     // human label
  instruction: string | null;
  modelId: string;         // references model-catalog
  temperature: number;     // 0..2
  toneOfVoice: string | null;
  voice: { voiceId: string } | null;  // provisional; voice work is future
}
```

- **Agent Studio** produces this snapshot from an `AgentVersion`.
- **Conversation** consumes it: it pins a snapshot onto each assistant turn (provenance), translating it through its own ACL into a Conversation-side VO. Conversation defines its own driven port to obtain snapshots — it does **not** import Agent Studio domain types, only this published shape.

## Context Map

`Conversation` is **downstream** of `Agent` (Customer/Supplier + ACL). Dependency points one way: Conversation may import `agent/published/*`; Agent Studio must **never** import from `conversation/`.

## Rules every agent follows (from CLAUDE.md)

- **TDD**: test-first, watch it fail, then implement. `bun test` must stay green. Domain layer is the unit-test priority; cover success **and** error/edge paths.
- **Clean Code**: no comments; self-declarative names; a file's name predicts its contents.
- **Object Calisthenics**: no `else` (early returns); loops delegate to a named helper per item; no `function*`/generators; small one-level methods.
- **Style**: arrow functions only; named exports only; Zod for boundary DTOs (schema is source of truth, infer the type).
- **Naming (backend)**: kebab-case + dotted token (`.value-object.ts`, `.entity.ts`, `.aggregate.ts`, `.policy.ts`, `.service.ts`); group by building block in plural folders.
- Run `bun test` continuously; finish only when the whole suite is green.

## Definition of done

When your task is complete and `bun test` is green, move your handoff MD into `handoff/done/` (create the folder if absent).
