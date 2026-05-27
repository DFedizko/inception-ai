# Handoff — Conversation as a branching tree

> **Read `handoff/contracts.md` first.** It lists the frozen artifacts and the rules.
> **You are running in parallel** with another agent building the new `src/bounded-contexts/agent/` context (`agent-studio.md`). **Do not touch the `agent/` folder.** You own `src/bounded-contexts/conversation/`.

## Goal

Remodel the `Conversation` aggregate so messages form a **branching tree** instead of a flat ordered list, mirroring ChatGPT's edit-and-rewind behavior — **but branching stays implicit** (the user never sees git vocabulary; the UI is page-style navigation between alternatives). Also record **provenance**: which agent version produced each assistant turn.

Today (`conversation/domain/aggregates/conversation.aggregate.ts`) the aggregate holds `messages: Message[]` (flat, ordered by `position`) and enforces a turn-order invariant. You are changing the internal structure while preserving existing behavior and tests where still valid.

## Ubiquitous language (changes)

- **Conversation** — *aggregate root*. Now holds a **tree of Messages** (built on `RevisionTree<Message>` from the shared kernel) plus an **active path** (the "HEAD" — the branch currently shown). Title derivation and content rules stay.
- **Editing a user message** creates an **alternative** message under the same parent → a new branch; the active path switches to it; everything downstream is dropped from that path and the AI reprocesses from there.
- **Turn-order invariant** now holds **per path** (root→leaf), not globally. A user turn cannot follow a user turn *along the active path*; an assistant reply answers the pending user message on that path.
- **Provenance** — each assistant turn records the `AgentVersionSnapshot` (frozen published type) that produced it: the conversation is **pinned** to the version it used. Translate the snapshot through a Conversation-side **ACL** into a Conversation VO (e.g. `AgentProvenance`); define a **driven port** (e.g. `AgentSnapshotProvider`) in `conversation/application/ports/` to obtain snapshots. **Do not** import Agent Studio domain types — only `agent/published/agent-version-snapshot.ts`. Do not implement the real adapter (Phase 2); a fake is enough for tests.

## What to build (TDD, test-first)

1. **Domain**: rework `Conversation` to wrap `RevisionTree<Message>` + active path. New behaviors: `editUserMessage(messageId, …)` → branches and re-points HEAD; `switchToBranch(messageId)`; the existing `recordUserMessage` / `recordAssistantReply` append onto the active path. Keep turn-order enforcement per path. Add `AgentProvenance` VO and record it on assistant turns.
2. **Application**: a use case for the user intention of **editing a message and continuing** (intention-named, not `UpdateMessage`). Update `send-message` / reply flow to attach provenance.
3. **Infrastructure**: update the Prisma repository to persist the tree (parent links) and active path, and the in-memory fake. Migration as needed (`bun run db:migrate`).
4. **Presentation**: adjust DTOs/controllers so the API can express alternatives/active path without leaking git terms.

## Constraints

- Build the tree **on top of `shared/versioning`** (`RevisionTree`/`Revision`). Do not reimplement graph logic.
- Never import from `agent/` except the frozen `agent/published/agent-version-snapshot.ts`.
- Keep existing passing tests green (or evolve them deliberately when behavior legitimately changes — explain in the test).
- Follow every rule in `contracts.md` (TDD, Clean Code, Object Calisthenics, naming, Zod).

## Done

`bun test` green for the whole suite → move this file to `handoff/done/`.
