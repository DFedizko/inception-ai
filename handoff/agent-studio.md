# Handoff — Agent Studio (new bounded context)

> **Read `handoff/contracts.md` first.** It lists the frozen artifacts and the rules.
> **You are running in parallel** with another agent working on `conversation-tree.md`, which remodels `src/bounded-contexts/conversation/`. **Do not touch the `conversation/` folder.** You own `src/bounded-contexts/agent/`.

## Goal

Promote `Agent` from the embedded value object it is today (inside the `Conversation` aggregate) to its **own aggregate root in a new bounded context: Agent Studio** (`src/bounded-contexts/agent/`). An Agent is **reusable across many conversations** and **versioned like git**: auto-incremented versions, deliberate branches, and a field-by-field diff.

This is a learning-grade, "open to scale" build. Apply Clean Architecture layers (domain · application · infrastructure · presentation) as the other context does.

## Ubiquitous language

- **Agent** — *aggregate root*. Has identity (`agentId`), a human name, and a **version history that branches** (a tree of `AgentVersion`). Outside access goes through the Agent.
- **AgentVersion** — *entity*. Immutable once created. Fields: `versionNumber` (auto-increment v1, v2… — the user never types this), `versionName` (human label the user provides), and a **config**: `Instruction` (reuse/move the existing `Instruction` VO concept), `modelId` (references the existing `model-catalog`), `temperature`, `toneOfVoice`, voice settings. A new version derives from a parent version → that is how **branches** form (deliberate, unlike conversations).
- **Branch** — a deliberate line of versions (e.g. a "formal tone" branch vs a "casual tone" branch). Built on `RevisionTree<AgentVersion-config>` from the shared kernel.
- **Diff** — `divergenceOf` from the kernel gives the structural divergence; on top of it compute the **field-by-field config diff** (the prompt text diff is shown GitHub-PR-style in the UI later — model the diff data here, not the rendering).

## What to build (TDD, test-first)

1. **Domain** (`agent/domain/`): `Agent` aggregate (`aggregates/`), `AgentVersion` entity (`entities/`), value objects (`value-objects/`) for the config pieces (`Instruction`, `Temperature`, `ToneOfVoice`, voice settings, `VersionName`, `VersionNumber`). Behavior, not anemic: creating a new version auto-increments the number and links it as a child of its parent version via the kernel; branching is explicit; a version is immutable. A `diff(versionA, versionB)` domain service producing a field-by-field difference.
2. **Application** (`agent/application/use-cases/`): intention-named use cases — e.g. `DefineAgent`, `ReviseAgent` (creates a new version), `BranchAgent`, `CompareAgentVersions`. Ports for persistence.
3. **Infrastructure** (`agent/infrastructure/`): repository (Prisma) + an in-memory fake for tests.
4. **Published Language**: produce `AgentVersionSnapshot` (the frozen type in `agent/published/agent-version-snapshot.ts`) from an `AgentVersion`. Provide an Open Host Service / port the Conversation side can call later to resolve a snapshot by `agentId` + `versionNumber`. **Do not wire it into Conversation** — that integration happens in Phase 2.
5. **Presentation** (`agent/presentation/`): controllers + Zod DTOs for the use cases.

## Constraints

- Build versioning **on top of `shared/versioning`** (`RevisionTree`/`Revision`). Do not reimplement graph logic.
- Never import from `conversation/`. You are upstream.
- The `agent/published/agent-version-snapshot.ts` file is **frozen** — produce that shape, don't change it.
- Follow every rule in `contracts.md` (TDD, Clean Code, Object Calisthenics, naming, Zod).

## Done

`bun test` green for the whole suite → move this file to `handoff/done/`.
