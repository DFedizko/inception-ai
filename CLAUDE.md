# Chat (MVP)

Single-user *chat* that stores conversations with an AI. The user can converse by **text** and by **voice**, in two voice modes:
- **voice-to-voice** — the user speaks and hears the AI reply in voice.
- **text-to-voice** — the user types and hears the AI reply in voice.

Never call it a "chatbot" in code or product copy. The product name is TBD — use **Chat** as placeholder. This is an MVP, but it must stay **open to scale** if we ever need to grow it.

> **Where to read more.** This root file holds the general, everyone-needs-it instructions. Layer-specific depth lives in nested guides — read the one for the area you're working in:
> - Backend → `src/bounded-contexts/CLAUDE.md` (Clean Architecture layers, tactical DDD, backend patterns & anti-patterns).
> - Frontend → `src/features/CLAUDE.md` (MVVM in depth, frontend patterns & anti-patterns, design & styling).

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## External technologies — check the primary source first

Whenever a technology, SDK, or API is mentioned, search its official documentation / primary source on the internet **first**. Domains, model IDs, and APIs evolve — do not rely on training memory. We rely on **AI providers** for text and voice (one of them is Gemini); always confirm the current provider docs before integrating.

## Domain-Driven Design — strategic (everyone)

The domain is the center of gravity. Both backend and frontend agents must know it.

**The order is non-negotiable — never skip step 1:**

1. **Model the domain *with the user* before writing anything.** Ask the user **business questions** until the domain is clear (terms, rules, invariants, lifecycles, edge cases). Establish/extend the ubiquitous language and the design *together with the user*; do not assume the business — when something is ambiguous, ask. Only when the model is agreed do you move on.
2. **Tests** (TDD — test-first, see below).
3. **Code** (and, on the backend, apply tactical DDD).

Treat this as a hard gate: **no tests and no code until the domain model is validated with the user.**

- **Ubiquitous language.** Entities, functions, and files mirror the business. Code is in English, but names reflect domain terms (e.g. "conversa" → `Conversation`). Do not invent synonyms.
- **Domain-first.** Model the domain before designing pages or frontend features. Pages/features and even database tables are *derived from* the domain, never the other way around.
- **Bounded contexts.** The backend is organized by bounded contexts. The MVP has **one**: the user conversing with the AI by text or voice. Other contexts (e.g. auth, billing) are added only if/when needed.
- **Anti-Corruption Layer (ACL).** Every external domain we depend on (AI providers such as Gemini) is a **foreign bounded context with its own model**. The dependency is one-way: **the external model adapts to ours, never the reverse.** An ACL is the translation barrier that maps the provider's shapes into our ubiquitous language so nothing "provider-flavored" leaks past it — including *composing* several provider calls when one of our domain operations has no native equivalent (e.g. a voice prompt that yields an image = transcribe-then-generate, hidden behind one port). This is the strategic side; **where the ACL lives in code (ports, adapters, `anti-corruption/` translators) is detailed in the backend guide.**
- **Context Map between our own contexts.** Internal bounded contexts integrate through an explicit Context Map, never by reaching into each other's model. The dependency points **one way** (downstream depends on upstream — e.g. `Conversation` is downstream of `Agent`), using a deliberate pattern (Customer/Supplier, Conformist, Shared Kernel, Open Host Service / Published Language, Partnership, Separate Ways — and ACL). **ACL is not the default; it is the *defensive* pattern** — use it wherever a context must protect its ubiquitous language from another's model (always against external systems like Gemini; internally where a downstream context would otherwise be polluted). Cross a boundary by **reference + a snapshot of what was used** (id + version), not by sharing live mutable state — this keeps provenance truthful and coupling low.
- **A bounded context must stay extractable into its own microservice.** Nothing crosses a boundary except through the Context Map (ids, events, published language), so any context could become a separate deployable talking only by events/contracts — use that as the litmus test for a clean boundary. The boundary is a *modeling* decision; becoming a service is a later, optional deployment choice it merely enables.
- Tactical DDD (aggregates, entities, value objects, policies, domain services) is detailed in the **backend** guide.

### Ubiquitous language (living glossary)

- **Conversation** — *aggregate root*: a thread of messages between the user and the AI. Has `id`, `title`, `createdAt`, messages; guards turn order and what each role may produce. Image/video generation **derives from a Conversation** — never a standalone artifact.
- **Message** — *entity*: one turn in a Conversation; has `id`, `role` (`user` | `assistant`), a `Modality`, and **one or more `Content`** (a turn may be mixed, e.g. text + image).
- **Modality** — value object for the **channel** of a turn: `text` | `voice`. (The *voice-to-voice* / *text-to-voice* modes are **derived** from the user↔assistant modality pair, not stored.)
- **Content** — the **artifact produced** in a turn, independent of Modality. Kinds: `text` | `audio` | `image` | `video`. A *user* turn carries only `text`/`audio` (the prompt); `image`/`video` appear only on *assistant* turns.
  - **TextContent** *(VO)*, **AudioContent** *(VO)*, **ImageContent** *(VO)* — immutable, "born ready".
  - **GeneratedVideo** *(entity)* — has identity and a **lifecycle** (`pending → generating → ready | failed`), because video generation (Veo) is asynchronous.
- **Title** — short label for a Conversation, derived from the user's first message.

Extend this glossary as new domain terms are agreed.

## Test-Driven Development (everyone)

**TDD is not optional.** Every main behavior gets a test written **before** its implementation — write the test, watch it fail, then make it pass. This holds for **both** layers, backend and frontend.

- Test-first, code-later. Use Bun's built-in runner (`bun test`) — **no external test runner**.
- Test the main behaviors before implementing them (back and front). Do **not** chase 90–100% coverage; cover the essentials. The Domain layer is the priority for unit tests.
- **For every behavior, imagine the main scenarios** — cover the **success paths *and* the error/edge paths** (invalid input, not-found, failures, empty/boundary values), not just the happy path.
- **Run the tests continuously** — `bun test` as you go, not only at the end. A task is finished only when the **whole suite passes**; keep it green at every step.
- Follow the **test pyramid**: a wide base of fast **unit** tests, fewer **integration** tests above. Run with `bun test`.
  - **Unit** — pure logic in isolation (domain entities/VOs/services on the backend; stores, viewmodel helpers, mappers on the frontend).
  - **Integration of units** — the frontend wires **React Testing Library + happy-dom** into `bun test` to render a feature and drive its DOM. Backend depth in `src/bounded-contexts/CLAUDE.md`; frontend depth (pyramid, setup) in `src/features/CLAUDE.md`.
- **Workflow:** 1. validate the domain model *with the user* (business questions first — see DDD strategic above) → 2. tests → 3. code.

## Architecture overview

Guiding goals: the **backend is decoupled from Next.js**, and the **frontend is decoupled from the backend** (the frontend calls backend routes). Simple now, open to scale later.

**Folders are not the architecture.** Discuss responsibilities and concepts first; create folders on demand. A single file may hold more than one responsibility — separation of *responsibility* does not require a separate folder. Next.js is opinionated; respect what it dictates (e.g. the `app/` folder) and fit our architecture around it.

**But once a responsibility has more than one file, give it a folder.** Don't let sibling files of different *kinds* pile up flat in one directory — group each kind under a folder named for the concept (e.g. inside a feature's `view-model/`, put Zustand stores in `stores/` and gateways in `gateways/`; group repositories, value objects, etc. likewise). Create these folders **the moment the second file of a kind appears**, not upfront. Favor this active grouping — a well-named folder tree is itself documentation.

- **Backend** — organized by **bounded contexts**, each following **Clean Architecture** with **Ports & Adapters** and **Dependency Inversion** (depend on abstractions, never implementations). Layers: Domain · Application · Infrastructure · Presentation. The only framework-coupled piece is the Next.js API (driving adapter) calling Presentation controllers. Depth in `src/bounded-contexts/CLAUDE.md`.
- **Frontend** — **feature-based**; each feature uses **MVVM** (View / ViewModel / Model) and gets its own dependency inversion (gateways depend on shared ports). Depth in `src/features/CLAUDE.md`.

### Project structure

Names like `conversation` and `chat` below are illustrative — the real tree grows on demand.

```
src/
│
├── app/                          # Next.js (opinionated) — the ONLY framework-coupled layer
│   ├── (chat)/                   #   route group → pages: thin, compose feature views, no UI logic
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/                      #   route handlers = DRIVING ADAPTERS (thin: HTTP → controller → Response)
│       └── conversations/
│           ├── route.ts          #     GET (list) / POST (create)
│           └── [id]/messages/route.ts
│
├── bounded-contexts/             # BACKEND — one folder per bounded context  (see its CLAUDE.md)
│   │                             #   (named "bounded-contexts" to avoid clash with React "context")
│   ├── conversation/             #   the single bounded context today (text & voice)
│   │   ├── domain/               #     aggregate roots, entities, value objects (e.g. Type),
│   │   │                         #       domain services, policies, builders — pure, unit-tested
│   │   ├── application/          #     use cases + application services (depend on ports)
│   │   ├── infrastructure/       #     driven adapters: repositories (Prisma + Postgres),
│   │   │                         #       AI provider clients + fakes for tests
│   │   └── presentation/         #     controllers (framework-free) + Zod schemas / DTOs
│   └── shared/                   #   backend SHARED KERNEL: cross-context domain primitives only
│
└── features/                     # FRONTEND — feature-based, one folder per feature  (see its CLAUDE.md)
    ├── chat/
    │   ├── view/                 #     presentation only (root View + components)
    │   │   ├── ChatView.tsx      #       root View: <Feature>View, PascalCase
    │   │   └── components/       #       presentational components used ONLY by this feature
    │   ├── view-model/           #     the MVVM logic layer
    │   │   ├── useChatViewModel.ts   #       hook: owns logic, imports setters via destructuring
    │   │   ├── stores/               #       Zustand stores (state + setters only, no logic)
    │   │   │   └── chat.store.ts
    │   │   └── gateways/             #       feature-specific API gateways (map DTO → read model)
    │   │       └── conversation.gateway.ts
    │   └── model/                #     entity/aggregate mirrors (classes w/ frontend-only rules) — <concept>.model.ts
    └── shared/                   #   frontend SHARED (never mixes back/front code)
        ├── ui/                   #     design-system primitives (Button, Input, Icon…)
        ├── hooks/                #     generic hooks (useDebounce, useMediaQuery…)
        ├── utils/                #     reusable pure helpers (formatDate, formatPhone…)
        ├── http/                 #     HttpClient port + fetch/axios adapters
        ├── storage/              #     cookies/localStorage/sessionStorage/IndexedDB adapters behind ports
        ├── gateways/             #     gateways promoted here when used by multiple features
        └── value-objects/        #     shared VOs (classes: private ctor + static create) — e.g. UUID
```

Notes:
- Backend and frontend keep **separate `shared`** folders — never one shared layer mixing back/front.
- The **dependency rule points inward**: `app/api` → `presentation` → `application` → `domain`; `infrastructure` is plugged in via DIP. Nothing inside `bounded-contexts` imports Next.js.
- Adopting `src/` requires updating `paths` in `tsconfig.json` and the Tailwind v4 `content` to include `src/`.

## Design patterns (everyone)

Use design patterns deliberately. **Judge the complexity of the problem and choose the pattern that fits** — drawing from the Gang of Four (*Design Patterns*) and Martin Fowler (*Patterns of Enterprise Application Architecture*). The patterns named in the backend and frontend guides (e.g. Builder, Repository, Composition) are **starting points and examples, not a closed list**. Do not fixate on a single named pattern; think first, then reach for the right one — including ones not mentioned here.

## Clean Code (everyone)

- **No comments.** Methods, functions, classes — every software element must be **self-declarative**. This is the strategic-DDD payoff: with names drawn from the ubiquitous language, no anemic models, and no CRUD/HTTP-verb names, reading the code is enough. If you feel the urge to write a comment, rename or restructure instead.
- **A name must predict its contents.** Before opening a file/element, its name should tell you exactly what's inside. Generic example: a `send-message` use case implements *sending* a message — not receiving one (that would be `receive-message`). Names never lie or surprise.

```ts
// avoid — needs a comment to be understood
// validates and stores the record
const handle = (x: Item) => { /* ... */ }
// instead — the name carries the meaning
const storeItem = (item: Item) => { /* ... */ }
```

## SOLID (everyone)

Apply SOLID across both layers:
- **S**ingle Responsibility — each unit has one reason to change.
- **O**pen/Closed — extend via new implementations, not by editing existing ones.
- **L**iskov Substitution — any adapter must be substitutable for its port.
- **I**nterface Segregation — small, focused ports over fat ones.
- **D**ependency Inversion — depend on abstractions (ports), never on concrete implementations. This is the backbone of our Clean Architecture and frontend gateways.

## Object Calisthenics (everyone)

Small, readable methods on both layers:
- **No `else`** — branch with **early returns** (guard clauses); handle the edge case first and `return`.
- **No generator functions** — never `function*` / `async function*` anywhere. Streaming is **callback-based** (`onChunk`/`onReply`). Consuming an *external* `AsyncIterable` (a provider SDK stream) with `for await` is fine; just never author your own generator.
- **Loops delegate** — a `for`/`while` body holds no branching logic: iterate and **call a named helper per item** (`lines.forEach((line) => emitLine(line))`).
- **Tiny, one-level-deep methods** — prefer many small named helpers over nested blocks.

## Code style (everyone)

- **Always arrow functions.** Never use `function` declarations.
- **Always named exports.** Never use `export default`.

```ts
// avoid
export default function getItem() {}
// instead
export const getItem = () => {}
```

## Conventions (everyone)

- **Validation & DTOs** — use **Zod** for all runtime validation. Define a Zod schema and **infer the type** from it for every DTO (controller inputs/outputs, use case boundaries, form schemas). The schema is the single source of truth; never hand-write a type alongside its schema.
- **File naming** — backend and frontend each have their own naming conventions; see their nested guides.

## Stack

Bun · Next.js 16 (App Router) · TypeScript · Tailwind v4 · **Prisma 7** ORM over **Postgres** (persistence) · **Zod** (validation) · **Inversify** (backend dependency injection — see the backend guide) · **Zustand** (state management) · **TanStack Query** (`@tanstack/react-query` — server-state caching/mutations behind the feature `query/` & `mutation/` hooks) · **React Hook Form** (forms) · **lucide-react** (icons) · **MSW** (Mock Service Worker — dev dep, HTTP interception in frontend integration tests) · AI providers for text and voice (e.g. Gemini).

> **Persistence.** Prisma 7 (TypeScript engine, `prisma-client` generator) talks to Postgres through the `@prisma/adapter-pg` driver adapter. The generated client lives in `src/generated/prisma` (gitignored — run `bun run db:generate` after install). Local dev runs Postgres via `docker compose up -d` (`bun run db:up`); set `DATABASE_URL` in `.env` (see `.env.example`).

> **Next runs under Node, not `bun --bun`.** The `dev`/`start`/`build` scripts call plain `next …` (resolved via its Node shebang). Bun stays the package manager and test runner, but the Next **server** must run under Node: Turbopack's external-module loader fails to resolve `@prisma/client` / `pg` when Next runs under the Bun runtime. (`@prisma/client`, `@prisma/adapter-pg` and `pg` are also declared in `serverExternalPackages` in `next.config.ts`.)

## Tooling — Bun is the runtime and package manager

This project runs on **Bun**, not Node/npm/yarn/pnpm. Use Bun for everything:
- **Install / add deps:** `bun add <pkg>` (`bun add -d <pkg>` for dev). Never `npm install`.
- **Run scripts:** `bun run dev`, `bun run build`. **Tests:** `bun test` (Bun's built-in runner — no external test deps).
- **Database:** Postgres runs locally via `docker compose up -d` (`bun run db:up`). Prisma is the ORM — `bun run db:migrate` (create/apply migrations), `bun run db:generate` (regenerate the client). Migrations live in `prisma/`.
