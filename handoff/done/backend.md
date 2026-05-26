# Handoff — Backend: Conversation context + Gemini

You implement the **backend** for text chat with Gemini and persistence. Read `handoff/README.md` (orchestration + **API contract** — that contract is binding) and `src/bounded-contexts/CLAUDE.md` (layers, tactical DDD, patterns, naming) before coding.

**You own only:** `src/bounded-contexts/**`, `src/app/api/**`, `package.json`/`bun.lock`, `.env.example`, `.gitignore`. **Never touch** `src/features/**`, `src/app/page.tsx`, `src/app/layout.tsx`, `tsconfig.json`, `bunfig.toml`, `globals.css`, test-setup files.

## Goal

Stand up the single bounded context `conversation` following Clean Architecture (Domain → Application → Infrastructure → Presentation), expose it through thin Next.js route handlers, and back it with `bun:sqlite` + Gemini streaming — fulfilling the API contract exactly.

## Step 0 — model the domain WITH THE USER (hard gate, before any test or code)

Per the root `CLAUDE.md` order, **do not write tests or code until the domain is validated with the user.** Open with **business questions** and converge on the model together, e.g.:
- What exactly is a Conversation's lifecycle? Can it exist with zero messages? When is it "started"?
- How is the **Title** derived — from the first user message verbatim, truncated, summarized? What if the first message is empty/very long?
- What are the invariants of a turn (roles allowed, can two user messages be consecutive, ordering guarantees)?
- Does `Type` (`text`|`voice`) belong on the Message, the Conversation, or both — and for this milestone is only `text` valid?
- What should happen if the AI provider fails mid-reply — is a partial assistant message kept or discarded?

Establish/extend the ubiquitous language with the user, then proceed to tests → code. Apply **tactical DDD** (below) once the model is agreed.

## External SDK — verify primary source first (project rule)

Before integrating, confirm against the **official Google Gen AI JS SDK docs** (it evolves): package `@google/genai`, server init `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`, streaming via `ai.models.generateContentStream({ model, contents })` (and/or `ai.chats` for multi-turn history). Confirm and pick a **current Gemini "flash" text model id** from the docs — do not hardcode a stale one from memory. Install with `bun add @google/genai`.

## TDD order (test-first, `bun test`)

Work inside-out; write the test, watch it fail, implement. Co-locate each `*.test.ts` next to its unit.

1. **Domain** (pure, no I/O — top priority for unit tests)
   - `Type` value object (`text` | `voice`) — self-validating.
   - `Message` entity (`role`, `type`, `content`, identity, `createdAt`) with behavior, not a data bag.
   - `Conversation` aggregate root: owns its messages; `start`, `addMessage`; enforces invariants (e.g. valid roles, ordering). All access through the root.
   - **Title policy**: derives a Title from the first **user** message (named, tested in isolation).
   - Avoid the Anemic Domain Model and CRUD-named operations — model **intentions**.
2. **Application** (use cases depending on ports, never concretes)
   - `StartConversation`, `ListConversations`, `GetConversation`, `SendMessage`.
   - `SendMessage` orchestrates: load aggregate → add user message → derive title if first → call the **AI provider port** to stream → emit chunks to the caller → persist the assembled assistant message. It depends on a `ConversationRepository` port and an `AiProvider` port (streaming). Design `SendMessage` so the **chunk stream is exposed to Presentation** (e.g. returns an async iterable) while persistence of the final assistant message happens when the stream completes.
3. **Infrastructure** (driven adapters behind the ports)
   - **Generic HTTP client (shared kernel) — build this; see the section below.** Driven adapters that make outbound HTTP calls use it.
   - `bun:sqlite` repository implementing `ConversationRepository` (schema: `conversations`, `messages`; FK message→conversation). Test against an in-memory sqlite DB.
   - Gemini adapter implementing `AiProvider` using `generateContentStream`. Provide an **in-memory/fake `AiProvider`** so use-case and route tests never hit the paid API. (If you call any provider over raw REST instead of its SDK, go through the generic HTTP client.)
4. **Presentation** (framework-free controllers + Zod)
   - Controllers validate input / shape output per the contract; one per use case. Zod schema is the single source of truth — infer DTO types from it.
5. **Next.js route handlers** (`src/app/api/**`, the only framework-coupled code — thin driving adapters)
   - Read the App Router route-handler guide in `node_modules/next/dist/docs/` first.
   - `src/app/api/conversations/route.ts` → `GET` (list) + `POST` (start).
   - `src/app/api/conversations/[id]/route.ts` → `GET` (one).
   - `src/app/api/conversations/[id]/messages/route.ts` → `POST` → return a **streaming `Response`** whose body is a `ReadableStream` of raw UTF-8 assistant text (pipe the use case's chunk iterable). `Content-Type: text/plain; charset=utf-8`.
   - Each handler: parse/validate → call controller → map result/errors to the contract's JSON error shape + status.

## Generic HTTP client (backend shared kernel)

Build a **fully generic, fully typed** HTTP client in the backend shared kernel (`src/bounded-contexts/shared/http/**`): a `HttpClient` **port** plus a `fetch` **adapter**. This is intentionally **its own client, separate from the frontend's** — duplication across the two layers is accepted; never import across layers.

Requirements:
- **All HTTP methods:** `get`, `post`, `put`, `patch`, `delete` (add `head`/`options` if trivial).
- **TypeScript generics done well** — request body and response are type parameters, e.g.
  `get<TResponse>(url, config?): Promise<TResponse>`, `post<TResponse, TBody = unknown>(url, body: TBody, config?): Promise<TResponse>`. No `any` in the public surface.
- **Config object:** headers, query params, `AbortSignal`, base URL.
- **Streaming / readers:** a first-class way to consume a streamed response body — e.g. `stream(url, config?): AsyncIterable<Uint8Array>` (or a typed text-reader option that decodes chunks). The streaming endpoint and any token-streaming provider depend on this.
- Depend on the **port** from adapters, never on `fetch` directly. Unit-test the adapter against a mocked `fetch` (including a fake `ReadableStream` for the streaming path).

## Persistence & config

- DB file under a gitignored path (e.g. `data/chat.sqlite`); create the schema on first run. Add the db path (and `.env.local`) to `.gitignore`.
- Add `GEMINI_API_KEY` to `.env.example` (placeholder only). Never log or expose the key; it is server-side only.

## Definition of done

- Domain validated **with the user** before tests/code (Step 0).
- Run `bun test` continuously; each behavior covers **success and error/edge scenarios** (invalid input → 400, unknown id → 404, provider failure → 500/partial handling, empty/oversized content, first-message Title derivation).
- `bun test` fully green: domain units, Title policy, repository (in-memory sqlite), `SendMessage` with the fake `AiProvider`, controllers.
- All four endpoints behave exactly per the contract (shapes, status codes, streaming body = raw text, JSON error envelope).
- `bun run build` passes. No imports of Next.js anywhere under `src/bounded-contexts/**`.
- With a real `GEMINI_API_KEY` in `.env.local`, `POST /api/conversations/:id/messages` streams a real Gemini reply and both messages + derived Title persist.
- **When all of the above hold and the suite is green, move this file (`handoff/backend.md`) into `handoff/done/`.**
