# Authoring handoffs (`handoff/`)

This folder holds **handoffs**: task specs one Claude instance writes for **other Claude instances** to execute. When you are asked to create a handoff, you act as the **orchestrator** — you design the work and the boundaries; you do **not** implement it.

Read the root `CLAUDE.md` and the relevant layer guide before authoring. Do **not** re-explain the product in a handoff — it already lives in `CLAUDE.md`; link to it instead.

## Mental model — always assume parallel agents

**Write every handoff as if many agents run at the same time**, right now, with no chance to coordinate mid-flight. It may be two tracks today and five tomorrow. Therefore the prime directive:

> **The code must never collide.** Two agents editing the same file, the same lockfile, or the same contract = broken work. Design the split so concurrent execution is safe by construction.

You achieve safety with three devices: **disjoint file ownership**, **a single frozen contract**, and **fakes for independent development**.

## The non-negotiables (checklist for every handoff set)

1. **Multiple-agents warning up front.** State explicitly that other agents work in parallel and the work must not conflict.
2. **Disjoint file ownership.** Give each track a set of paths it may touch — and the sets **must not overlap**. Add explicit "must not touch" rules for the tempting shared files.
3. **One owner for shared/risky files.** `package.json`/lockfile, `.env*`, `.gitignore`, config files (`tsconfig`, `bunfig.toml`, global CSS, test setup) — assign to **exactly one** track, or to none. Never let two tracks add deps.
4. **A single shared contract = the only seam.** When tracks must interoperate (e.g. an HTTP API), define the contract once as the **single source of truth**: exact shapes, endpoints, status codes, streaming/format details, error envelope. **No track may change it unilaterally** — they stop and flag the orchestrator.
5. **Independent development against fakes.** Each track must be able to build and test **without the others running** (mocks/fakes behind ports). Describe the **integration checkpoint** where the real pieces meet.
6. **Domain-first gate** (see below) — mandatory for any new feature.
7. **TDD + continuous test runs** (see below).
8. **Completion ritual** — move the finished handoff into `handoff/done/` once its suite is green.

## Anatomy of a handoff set

- **`README.md` — orchestration.** Lists the tracks; states the parallel-agents warning; the **ownership matrix** (Area · Owner · Paths) + hard "must not touch" rules; the **shared contract**; env vars; the process gate; the "run tests continuously + move to `done/`" rules; the integration checkpoint. Keep it the place where cross-track truth lives.
- **One MD per track** (e.g. `backend.md`, `frontend.md`). Each: what it owns / must not touch; goal; **Step 0 domain modeling**; ordered TDD steps; specifics; a concrete **Definition of done** ending with "move this file to `handoff/done/`".

## Conflict-free parallelism (the core skill)

- Split by **bounded context / layer / feature**, never by "we'll both edit these files."
- The matrix is the contract for *who writes where*. If you can't make the sets disjoint, the split is wrong — redesign it (extract a shared contract, move a file's ownership, sequence the work).
- The shared **contract decouples timing**: agents code to the contract, not to each other's code, so order of completion doesn't matter.
- Call out the **integration checkpoint** as a single, small, explicit step (e.g. "switch the injected adapter from the fake to the real one").

## Domain-first gate — force business questions (every new feature)

For **any new feature**, the executing agent must **model the domain *with the user* before writing tests or code** — this is DDD strategic and it is **mandatory, every time**. In the handoff, make this **Step 0** and require the agent to **ask the user business questions** (terms, rules, invariants, lifecycles, edge cases) and agree on the ubiquitous language *before* moving on. Provide example questions seeded from the feature. State it as a hard gate: **no tests, no code until the domain is validated with the user.** The order is always: **1) model domain with the user → 2) tests → 3) code** (tactical DDD on the backend).

## TDD in handoffs

- Test-first, `bun test`, no external runner. Lay out the steps **inside-out** (domain → application → infra → presentation; or shared → model → gateway → store → viewmodel → view).
- Require **scenario coverage**: success paths **and** error/edge paths (invalid input, not-found, failures, empty/boundary, mid-stream errors).
- Require **running the suite continuously** and finishing only when it is **fully green**.

## Completion → `done/`

End every track's Definition of done with: *"when the suite is green and the DoD holds, move this file into `handoff/done/`."* An empty `handoff/` (besides `README.md`, this guide, and `done/`) means the milestone is complete.

## Style

Objective and descriptive — enough for the agent to act without guessing, not a wall of text. Prefer tables, ordered steps, and exact names/paths. Don't restate the root or layer guides; point to them. Verify any external SDK/API against its **primary source** before encoding specifics into a handoff.
