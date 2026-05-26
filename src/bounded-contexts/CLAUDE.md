# Backend guide (`src/bounded-contexts`)

This guide governs all backend code. Read the **root `CLAUDE.md`** first for the product, the strategic DDD / ubiquitous language, TDD, and the general design-patterns stance — they are not repeated here.

The backend is **framework-free** (nothing here imports Next.js) and organized by **bounded contexts**. Each context follows **Clean Architecture** with **Ports & Adapters** (hexagonal) and **Dependency Inversion**: every layer depends on **abstractions (ports), never concrete implementations**. This is what makes the core testable with fakes.

## Layers & responsibilities

The **dependency rule points inward**: `presentation → application → domain`, with `infrastructure` plugged in via ports. Inner layers know nothing about outer ones.

### Domain — the heart
Pure business rules. No DB, no framework, no I/O. Fully covered by unit tests. Holds aggregate roots, entities, value objects, domain services, and policies (see Tactical DDD below).

### Application
**Use cases** and **application services** that orchestrate the domain to fulfill a user intention. They depend on ports (e.g. a repository interface, an AI provider interface), never on concrete adapters. Application services coordinate; the *rules* stay in the domain.

- **Each use case is its own class in `application/use-cases/`** (`<intention>.use-case.ts`, e.g. `send-message.use-case.ts`), with a single `execute(...)` named for the user's intention — never CRUD/HTTP verbs. Keep its unit test beside it.
- **For a cluster of very simple use cases you may use one application service instead** — a single class where *each method is a use case* (named by intention). It's a judgment call: separate classes when a use case is substantial or has its own collaborators; one application service when they're thin. Document whichever you pick; don't mix the same intention across both.
- **Ports** live in `application/ports/` (named by concept, no `.interface`), and **injection tokens** (symbols for those ports) in `application/tokens.ts` — see *Dependency injection* below.

### Infrastructure (driven adapters)
Concrete implementations of the ports: repositories backed by **Prisma (Postgres)**, AI provider clients, etc. Provides **test doubles** (e.g. a fake AI provider, an in-memory repository) so tests never hit real, paid APIs. Swapping an implementation must not touch domain or application code.

#### Anti-Corruption Layer (ACL)
The root guide states the strategic rule: an external provider (e.g. Gemini) is a **foreign bounded context** whose model must adapt to ours, never the reverse. The ACL is **how that rule is realized here** — it is the driven-adapter boundary, made explicit:

- **The port (`application/ports/`) is written in our ubiquitous language.** It never names provider concepts, model IDs, or wire shapes.
- **The adapter (`infrastructure/.../<concept>.<provider>.gateway.ts` or `.<provider>.ts`) implements that port and stays thin** — it orchestrates the provider client and delegates all *translation* to the ACL.
- **The translation lives in an `anti-corruption/` folder beside the adapter, as `<concept>.translator.ts`.** A translator maps the provider's shapes ↔ our domain in both directions; nothing "provider-flavored" crosses it. This is also where you **compose** several provider calls when one of our domain operations has no native equivalent (e.g. a voice prompt that yields an image → transcribe-then-generate, behind a single port). Per the root rule "once a responsibility has more than one file, give it a folder", create `anti-corruption/` the moment a second translation appears — until then a thin adapter may translate inline.

```
conversation/infrastructure/ai/
├── ai-provider.gemini.ts                 # adapter: implements the port, delegates translation
└── anti-corruption/
    ├── gemini-message.translator.ts      # maps Gemini shapes ↔ our Message/Content
    └── gemini-generation.translator.ts   # composes transcription + image/video generation
```

The **fake** adapter (test double) implements the same port without any ACL — there is no foreign model to protect against.

### Presentation
**One controller per bounded context** (`presentation/controllers/<context>.controller.ts`, e.g. `conversation.controller.ts`) — **not** one controller per use case. Each controller **method** corresponds to a use case and is named for the user's intention (`startConversation`, `sendMessage`, …); the method invokes the matching use case. Controllers do runtime validation of inputs (via Zod schemas) and shape outputs (e.g. JSON / a streamed body). **Framework-free** — a controller does not know about Next.js. The Next.js API route handlers (in `src/app/api`) are the **driving adapter** that resolves the controller from the DI container and calls a method; they are the only framework-coupled code.

- **Streaming is callback-based, never a generator.** A method that streams (e.g. `sendMessage`) returns a web-standard `ReadableStream` and the use case pushes chunks through an `onChunk` callback. **Do not use generator functions (`function*` / `async function*`)** anywhere in the backend — prefer callbacks / `ReadableStream` / `Promise`, which read more intuitively.
- **Validation errors are reusable and field-aware.** Throw the shared `ValidationError` (from `shared/errors/`) carrying `{ field, message }[]`; the route maps it to `400 { error: { message, fields } }` so the client sees exactly which fields failed.

## Dependency injection

Dependencies are wired with **Inversify using decorators** (`@injectable()` / `@inject()`). Each bounded context has one `di.ts` holding the container; route handlers resolve from it.

## Shared kernel (`shared/`)

Cross-cutting, framework-free building blocks shared across contexts live under `bounded-contexts/shared/` grouped by kind — e.g. `shared/http/` (the generic `HttpClient` port + fetch adapter) and `shared/errors/` (reusable errors such as the field-aware `ValidationError`). Never import frontend code here.

## Tactical DDD

Model behavior, not data. Pick the right building block:

- **Value Object** — defined by its value, immutable, no identity (e.g. `Modality` = `text` | `voice`). Use for concepts that are *descriptions* and can self-validate their invariants. Prefer VOs over primitives ("primitive obsession" is a smell).
- **Entity** — has identity and a lifecycle; its attributes change over time but it stays "the same thing". Must have **behavior**, not just data.
- **Aggregate root** — the entity that guards a cluster of objects (entities + VOs) as one consistency boundary. All outside access goes *through the root*; it enforces the invariants of the whole aggregate.
- **Domain service** — a domain operation that doesn't naturally belong to a single entity/VO. Still pure, still framework-free.
- **Policy** — an explicit, named business rule/decision (e.g. how a Conversation's title is derived). Extract policies when a rule is worth naming and testing on its own.

Create these on demand — don't pre-build empty layers.

### Materialize every building block in its own folder

Inside each context's `domain/`, **always group by tactical building block** — one folder per *kind*, named in the plural, with the building block's type token in the file name. This is enforced, not optional: a value object never sits loose in `domain/`, it lives in `value-objects/`. Create the folder when its first member appears (on demand), then keep adding to it.

| Building block | Folder | File token | Example |
|---|---|---|---|
| Value Object | `value-objects/` | `.value-object.ts` | `value-objects/modality.value-object.ts` |
| Entity | `entities/` | `.entity.ts` | `entities/role.entity.ts` |
| Aggregate root | `aggregates/` | `.aggregate.ts` | `aggregates/conversation.aggregate.ts` |
| Domain service | `services/` | `.service.ts` | `services/transcription.service.ts` |
| Policy | `policies/` | `.policy.ts` | `policies/title.policy.ts` |

- **The token tells you what a thing *is*.** `role.entity.ts` is an entity; if that same concept were a value object it'd be `role.value-object.ts` in `value-objects/`. You decide the building block from the domain, then the folder + token follow.
- **An entity that owns other entities/VOs as one consistency boundary becomes an aggregate root** — move it to `aggregates/` as `<name>.aggregate.ts`; outside access goes through it.
- **Design patterns get folders too** (see below): a Builder lives in `builders/` as `<name>.builder.ts`, and so on for any pattern you apply. Folders for the things — never a pile of mixed kinds in one directory.

```
domain/
├── value-objects/   └── modality.value-object.ts
├── entities/        └── role.entity.ts
├── aggregates/      └── conversation.aggregate.ts
├── policies/        └── title.policy.ts
├── services/        └── transcription.service.ts
└── builders/        └── conversation.builder.ts
```

## Design patterns (backend)

These are **examples to reach for, not a closed list** (see the root guide). Judge complexity and choose; explore other GoF / Fowler patterns when they fit better. **Any pattern you apply gets its own folder** named for it (`builders/`, `repositories/`, `daos/`, `query-objects/`, …) with a matching file token (`<name>.builder.ts`, `<name>.repository.ts`, …) — same rule as the domain building blocks above.

- **Builder (GoF)** — great for constructing complex aggregate roots with many parts/invariants, keeping construction readable and valid.
- **Repository** — *conceptually tied to aggregates*. A repository fetches, persists, or modifies an **aggregate** (an aggregate root can be thought of as an entity in this sense). If you're not loading/saving an aggregate, you don't want a repository.
- **DAO (Data Access Object)** — for **plain data reads** that don't map to an aggregate (e.g. a dashboard / reporting query, read-only projections). Keep DAOs separate from repositories.
- **Query Object (Fowler)** — when a DAO grows too large, break each query into its own Query Object and let the **DAO orchestrate Query Objects**. Keeps data access composable and testable.

## Class style

Classes live mostly here (the frontend rarely uses them).

- **Member order, top to bottom:** properties → constructor → public methods → private methods. (Skip the standalone properties block when you declare them directly in the constructor.)
- **No standalone helper functions in a class file.** A non-exported helper that assists a class — e.g. a `mapToEntity` mapper from a DTO or a DB row to an entity — must be a **private method** of that class, placed in the order above. If a function inside a class file isn't exported for reuse, it becomes a private method.

```ts
// instead — properties, constructor, public, then private (helper is a private method)
export class ItemRepositoryPrisma {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Item> {
    return this.toEntity(await this.prisma.item.findUniqueOrThrow({ where: { id } }));
  }

  private toEntity(row: ItemRecord): Item { /* ... */ }
}
```

## File naming (backend)

- **kebab-case for every file, with a dotted type token.** Use hyphens for multi-word names and a dot to denote the file's role, e.g. `conversation.repository.ts`.
- **Domain building blocks** carry their building-block token and live in their plural folder — `.value-object.ts`, `.entity.ts`, `.aggregate.ts`, `.policy.ts`, `.service.ts` (see *Materialize every building block in its own folder* above). Likewise any applied pattern: `.builder.ts`, etc.
- **Ports/interfaces drop the `.interface` token** — name them by the concept (e.g. a port `User` → `user.ts`).
- **Implementations add role + technology:** `user.repository.prisma.ts`, `user.repository.in-memory.ts`. (An `adapter` token is allowed but usually unnecessary — the technology says enough.)
- **Gateways** (for talking to external APIs; Next doesn't opine): port `<concept>.gateway.ts`; concrete adapter adds the provider, `<concept>.<provider>.gateway.ts`.

## Anti-patterns (backend) — avoid

- **Anemic Domain Model (Fowler).** Entities/aggregates that are just bags of getters/setters mirroring database columns, with no behavior. Wrong direction. The **database reflects the domain, never the reverse** — model the domain via the ubiquitous language first, then map persistence to it. An entity is **not** a table row; every entity/aggregate must carry behavior and protect its invariants.

```ts
// avoid — anemic: data only, invariants leak to callers
class Cart { items: Item[] = []; total = 0; }
// instead — behavior protects the invariant
class Cart {
  private items: Item[] = [];
  add(item: Item) { this.items.push(item); }
  total(): Money { /* derived from items */ }
}
```

- **CRUD-named use cases.** Use cases / application / domain services whose names and methods mirror CRUD or HTTP verbs (`create`, `get`, `update`, `delete`, `patch`). Use cases must reflect **user intention** — e.g. "send a message", "start a voice session" — not "update the messages table". CRUD/HTTP verbs belong to **repositories and DAOs**, not to use cases or services.

```ts
// avoid — CRUD/HTTP leaking into a use case
class UpdateMessage {}
// instead — names the user's intention
class SendMessage {}
```
