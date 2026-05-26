# Track 2 — Backend: model catalog

Read `handoff/README.md` (orchestration + contract — binding) and `src/bounded-contexts/CLAUDE.md` first.

**You own only:** `src/bounded-contexts/model-catalog/**` (a **new bounded context**), `src/app/api/models/**`. **Never touch** the conversation context, other tracks' folders, `package.json`/`.env.example` (you reuse the existing `GEMINI_API_KEY`), configs, test setup.

## Goal

Expose the Gemini models the user can pick, as `GET /api/models` per the contract: `{ models: ModelInfo[] }` with `ModelInfo = { id, label, capabilities: ("text"|"speech"|"live")[] }`. This is a **distinct concern** from conversing — hence its own bounded context.

## Step 0 — model WITH THE USER (hard gate)

Ask before coding, e.g.:
- What makes a model worth showing — all provider models, or only those usable here (text + speech + live)? Any allow/deny list?
- How do we map provider capability flags to our `"text" | "speech" | "live"`? What if a model has none we support — hide it?
- What is the human `label` (provider display name, or our own)? Any ordering (recommended first)?
- Do we cache the catalog (it rarely changes) or fetch per request? For how long?

Confirm `ai.models.list()` shape and capability fields against the **official SDK docs**. Establish the ubiquitous language (e.g. `Model`, `Capability`), then tests → code.

## TDD order (test-first, `bun test`; fakes only — never the real API)

1. **Domain** — a small read-oriented model: `Model` (id, label, capabilities) and a `Capability` VO/union with the mapping rule (a **policy** if worth naming/testing: "provider actions → our capabilities"). Pure, unit-tested.
2. **Application** — `ListAvailableModels` use case depending on a **`ModelCatalogProvider` port**; filters/maps to `ModelInfo`. Unit-test with a **fake provider** returning canned provider models.
3. **Infrastructure** — Gemini adapter implementing the port via `ai.models.list()` (reuse the existing API-key init pattern). Provide a **fake** so tests never call the real API. Consider caching here if agreed.
4. **Presentation** — a `model-catalog` controller shaping `{ models: ModelInfo[] }`; Zod-validate/shape the output; JSON error envelope. Framework-free.
5. **Route + DI** — `src/app/api/models/route.ts` (`GET`) resolves the controller from this context's own `di.ts` container and returns JSON.

## Definition of done

- Domain/feature validated with the user (Step 0).
- `bun test` green continuously; cover success + edge (empty/filtered list, a model with unsupported capabilities hidden, provider failure → 500).
- `GET /api/models` matches the contract exactly.
- `bun run build` passes; no Next.js imports inside the context; no edits outside your folders.
- With a real key, the endpoint returns the live model list mapped to `ModelInfo`.
- **When green and DoD holds, move this file to `handoff/done/`.**
