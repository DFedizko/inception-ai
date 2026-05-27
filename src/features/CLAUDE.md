# Frontend guide (`src/features`)

This guide governs all frontend code. Read the **root `CLAUDE.md`** first for the product, the strategic DDD / ubiquitous language, TDD, and the general design-patterns stance — they are not repeated here.

The frontend is **decoupled from the backend**: it calls backend routes and never imports backend code. Its job is **presentation** — business rules live in the backend.

## Feature-based architecture

The frontend is organized by **features**, derived from the domain (domain-first still applies — features come *after* the domain is modeled, never drive it).

- A **feature** is a vertical slice of user-facing capability tied to a domain concept (e.g. Chat, ConversationHistory, VoiceSession). It *has behavior*: state, presentation logic, calls to backend routes. It is the MVVM triad.
- A **component** is a reusable, "dumb" presentation unit: props in, UI out, no domain knowledge. It may hold trivial **UI-local state** (controlled input, active tab, open/closed) but never *application/feature* state — that belongs to the ViewModel. A feature is *composed of* components; a component is never a feature.
- A **page** (a Next route under `src/app`) is thin **composition/layout** — a container that mounts one or more features and holds no bespoke UI logic. A page may compose several features (e.g. Chat + ConversationHistory on one screen).

## MVVM

Each feature is split into three concerns.

### View
Presentation only — the feature's **root View component** plus its smaller components. No business logic, no data fetching. Reads state and calls handlers exposed by the ViewModel. All UI (including the feature's own `components/`) lives under `view/`.

The **root View** is the feature's top-level presentation component that composes the smaller components. Name it `<Feature>View` in **PascalCase** — e.g. `ChatView.tsx` — mirroring how we name the `ViewModel` and the `Model`. We do **not** call it a "Screen". Its child components stay kebab-case (`chat-header.tsx`, `message-list.tsx`).

### ViewModel
The feature's presentation logic — **a hook + Zustand store, never a class**. `view-model/` splits into concerns (folders on demand):

- **`stores/`** — Zustand: state + setters only, no logic; defaults built in the store.
- **`gateways/`** — the feature's gateways (port + adapters).
- **`query/` / `mutation/`** — one hook per read / write, built on **TanStack Query**, each taking the gateway by its **port** (our DIP). `query/` = `useQuery` (inline `queryKey` tag + `enabled`/`staleTime`), syncs `data`/loading into the store, returns `{ <domain>, isPending, error }`. `mutation/` = `useMutation` + `useQueryClient` (`mutationFn` sets state, `onSuccess` invalidates tags). **The hook owns the outcome of its call** — it `notify`s its own error (query: effect on `error`; mutation: `onError`) and success, since handling the HTTP result is the same responsibility as making the call (like a backend adapter throwing for the framework — here the "framework" is the notification UI). No sequencing/business rules; touch only setters. Cache by tag — skip only ephemeral reads (e.g. a live token, a mutation).
- **`use<Feature>ViewModel` = orchestration only** (the frontend "use case"), **no `try/catch` and no error handling**: it consumes the hooks, syncs `data`→store, derives flags (e.g. `isReplying` from `isPending`), and exposes handlers that just trigger queries/mutations.

A stateful non-fetch concern (e.g. live voice: connector + mic/sink) gets its **own concern hook** (`live/useLiveSession.ts`) that orchestrates and reuses the query/mutation hooks.

**Who reads what:** components/View/pages read state (non-setters) from the store by **destructuring** (`const { messages } = useChatStore()`, never per-field selectors); setters stay private to the view-model layer.

### Model
A **mirror** of the backend **entities/aggregates** that **carries behavior** — the *few* rules that genuinely belong on the frontend. The bulk of the business rules live in the backend; a Model holds only what is **frontend-only** or trivially derivable from its own data, so views/viewmodels stop re-deriving it. Gateways map backend DTOs into these Models.

- **Models with behavior are classes; data-only mirrors stay `type`s.** A Model becomes a `class` the moment it has cohesive frontend rules to own — e.g. `AiModel.isLive()` instead of scattering `capabilities.includes("live")`, or `Message.isFromUser()`/`media()` instead of inlining `role === "user"` in a view. No such rules → keep it a plain `type` (`Conversation`, `ConversationSummary`). Don't force behavior that isn't there. *(Reference: Fowler, [Modularizing React Apps](https://martinfowler.com/articles/modularizing-react-apps.html).)*
- **Class Models use constructor parameter properties** (`constructor(readonly id: UUID, …) {}`), method syntax, and stay immutable (a mutation returns a *new* instance, e.g. `withAppended`).
- **Only entity/aggregate mirrors are Models** — name them `<concept>.model.ts`. Mere *channel/label* VOs (e.g. `Type`, `Role`) collapse to a **plain union** inline in the Model — no class, no `.model.ts`; VOs with validation/identity are classes in `shared/value-objects/` (see below).

## Hooks
A ViewModel *is* a hook, but **not every hook is a ViewModel**. Generic, domain-agnostic hooks (`useDebounce`, `useMediaQuery`, …) are reusable presentation tools that ViewModels *compose* — they live in frontend `shared/hooks`, not inside a feature. They don't break MVVM; they're inputs to the ViewModel.

## Dependency inversion & gateways
The frontend gets DIP too. Generic, reusable adapters live in frontend `shared` behind **ports (abstractions)**:
- `shared/http` — an `HttpClient` port with `fetch`/`axios` adapters.
- `shared/storage` — ports for cookies / localStorage / sessionStorage / IndexedDB, each with its adapter.
- `shared/utils` — reusable pure helpers (e.g. `formatDate`), `shared/hooks` — generic hooks, `shared/ui` — design-system primitives.
- `shared/value-objects` — cross-feature **value objects** (see below).

### Value objects
VOs that carry **validation or identity** live in `shared/value-objects/` as **immutable classes** with a **private constructor** and a **static `create` factory** that validates and returns the instance (e.g. `UUID.create(value)`). Use them on Models (e.g. an id typed `UUID`); cross to primitive boundaries (paths, query keys, store) with `.value`.

**Gateways** (we say *gateway*, not "service" — "service" is reserved for the backend) call backend routes and map DTOs into read models. A **feature-specific gateway** lives in that feature's `view-model/gateways/` and depends only on the shared ports, never on a concrete client (so tests inject fakes). A gateway used by **multiple features** is **promoted** to `shared/gateways`.

### Outbound adapters are classes
Anything that talks to the outside world (gateways, HTTP/storage adapters, any external integration) is a **class** that `implements` a port (`interface`), takes collaborators by constructor injection, and is created with `new` at a single injection point. Public methods on top, ex-helpers as private methods below.

```ts
export interface Gateway { load(): Promise<Model[]>; }

export class HttpGateway implements Gateway {
  constructor(private readonly http: HttpClient) {}
  async load() { return (await this.http.get<Dto[]>("/path")).map((d) => this.toModel(d)); }
  private toModel(dto: Dto): Model { /* ... */ }
}
```

**Hooks, utils, and Zustand stores stay functional** — class methods are the intended exception to the global "always arrow functions" rule, alongside **Models with behavior** and **value objects** (the other two kinds of frontend classes).

## Reuse & promotion
Components/hooks/gateways used by only one feature live inside that feature; generic primitives (design system, utility hooks, http/storage adapters) live in `shared`. When something starts being reused across features, **promote** it into `shared` rather than importing across features.

## Design patterns (frontend)

Examples to reach for, **not a closed list** (see the root guide) — judge and explore other patterns when they fit.

### Composition pattern (preferred for compound components)
Use composition to build compound components — **but not** the single-file dot-notation style where every sub-part is declared in one module and importing it pulls the whole bundle (heavy KBs). Instead:
- Each piece of the composition is its **own file with an isolated import**, so consumers only pay for the pieces they use.
- The component exposes a **Root** that acts as the container and owns the shared state via a **Zustand store** (its "context").
- Each child piece **reads from the Root's store** and **validates it is rendered inside the Root** — if used outside, it **throws** a clear error.
- Create a folder for all the composed component.

This avoids prop-heavy APIs and keeps imports lean.

## Anti-patterns (frontend) — avoid

- **Prop drilling.** Threading state through 3–4 levels of components via props. Instead, let the **ViewModel orchestrate Zustand stores** so components read the state they need **directly from the store**, not through intermediate props.

```tsx
// avoid — value threaded through layers that don't use it
<Page user={user}><Sidebar user={user}><Profile user={user} /></Sidebar></Page>
// instead — leaf reads from the store
const Profile = () => { const user = useUserStore(s => s.user); /* ... */ }
```

- **Props apocalypse ("props-pocalypse").** A component accumulating many configuration/boolean props (`iconLeft`, `iconRight`, `hideText`, `showText`, …). Break it with the **Composition pattern**: pass `children`/composed pieces instead of flags, so the component stays small and flexible.

```tsx
// avoid — flags pile up
<Button iconLeft={<Icon/>} hideText showSpinner />
// avoid — dot-notation drags the whole component in on import
<Button><Button.Icon /><Button.Label>Save</Button.Label></Button>
// instead — each piece is its own file with an isolated import
import { ButtonRoot } from "./button-root";
import { ButtonIcon } from "./button-icon";
import { ButtonLabel } from "./button-label";
<ButtonRoot><ButtonIcon /><ButtonLabel>Save</ButtonLabel></ButtonRoot>
```

- **`"use client"` hoisted onto a View or page.** A View/page that only *composes* must stay a **Server Component** (no directive). Putting `"use client"` at the top makes the whole subtree client and kills Server Components below it — nothing can render server-side anymore. **Server by default; push `"use client"` down to the leaf** that actually needs state, an effect, a store read, or an event handler — and split a component when only *part* of it needs the client (a server shell wrapping a small client leaf).

```tsx
// avoid — the whole view is client just to read `mode` from the store
"use client";
export const ChatView = () => {
  const { mode } = useChatStore();
  return <Layout>{mode === "voice" ? <VoiceStage/> : <Messages/>}</Layout>;
};
// instead — View stays a Server Component; the store read lives in a client leaf
export const ChatView = () => <Layout><ChatBody/></Layout>;        // no directive
// chat-body.tsx
"use client";
export const ChatBody = () => {
  const { mode } = useChatStore();
  return mode === "voice" ? <VoiceStage/> : <Messages/>;
};
```

## Component file conventions

- **One component per file.** Never declare two component constants/functions in the same file.
- **Read top-to-bottom in this order:** imports → props type (typed at the top) → the component → component-only helpers *below* the component. A helper that serves only this component (and won't be reused) goes **under** the component so the file reads in importance order.
- **Always question reusability of helpers.** When you write a helper like `formatDate` or `formatPhone`, ask: *could other components need this later?* If yes, don't bury it in the component — extract it to `shared/utils`. Local-only helpers stay below the component; reusable pure helpers move to `shared/utils`.

```tsx
// imports → props type → component → local-only helper below
import { Avatar } from "@/features/shared/ui";

type UserBadgeProps = { name: string };

export const UserBadge = ({ name }: UserBadgeProps) => <Avatar alt={initials(name)} />;

const initials = (name: string) => name.charAt(0).toUpperCase();
```

## File naming (frontend)

- Follow **Next.js conventions** — confirm in `node_modules/next/dist/docs/` and keep it standardized.
- **Root View component: PascalCase `<Feature>View.tsx`** (e.g. `ChatView.tsx`) — mirrors `ViewModel`/`Model`. Its child components are **kebab-case** (e.g. `chat-input.tsx`).
- **Model files: `<concept>.model.ts`** for entity/aggregate mirrors (e.g. `conversation.model.ts`). Value-object-shaped unions get no `.model.ts` file — inline them in the model that uses them (see *Model* above).
- **Pages / route files: exactly what Next dictates** (`page.tsx`, `layout.tsx`, `route.ts`, etc.).
- **Gateways** (Next doesn't opine on these): kebab-case with a dotted type token — port `<concept>.gateway.ts` (e.g. `conversation.gateway.ts`); concrete adapter adds the provider, `<concept>.<provider>.gateway.ts`.
- **Query/mutation & concern hooks: camelCase `use<Operation>.ts`**, named for the operation — `useListConversations.ts`, `useSendMessage.ts`, `useLiveSession.ts` (mirrors `useChatViewModel`).

## Testing (TDD)

**Test-first, always** (root guide). On the frontend, before writing a feature, write the test for its main behavior, watch it fail, then implement. Don't chase coverage — cover the **essential behaviors** of each main feature.

We work the **test pyramid**: many cheap unit tests at the base, fewer integration tests above, no E2E for now.

```
        ╱╲        (no E2E yet)
       ╱  ╲
      ╱ IT ╲      Integration — React Testing Library + happy-dom
     ╱──────╲       render a feature, drive the DOM, assert behavior
    ╱  UNIT  ╲    Unit — bun test
   ╱──────────╲     pure logic: stores, viewmodel helpers, gateway mappers
```

- **Unit (`bun test`).** Bun's built-in runner — no external runner. Test pure, isolated logic: store reducers/setters, ViewModel helpers, gateway DTO→read-model mapping. Fast, no DOM.
- **Integration of units (React Testing Library + happy-dom).** Two flavours: (a) **feature** — render the View + ViewModel + store and drive the DOM (`getByRole`/`findByText`), wrapping in `buildQueryWrapper()` so TanStack has a client; (b) **hook** — `renderHook` a `query/`/`mutation/` hook with the **real HTTP gateway** and intercept the request with **MSW**, asserting on the store and the returned `{ data, isPending, error }`. Prefer role/text queries over test ids.
- **MSW (`msw`) for the HTTP boundary.** `query/`/`mutation/` hook tests don't fake the gateway — they let the real gateway hit `fetch` and **MSW returns the response**, so the gateway's DTO→model mapping is covered too. Mock **data only** (objects/arrays of DTOs — no library code) lives in `view-model/mocks/<gateway>/` (one folder per gateway). Register per-test handlers with `server.use(http.get(...))`.

**Setup (already wired — keep it standardized):**
- Dev deps: `@happy-dom/global-registrator`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `msw`.
- `bunfig.toml` → `[test] preload = ["./happydom.ts", "./testing-library.ts", "./src/test/msw.ts"]` registers the DOM, the jest-dom matchers, and the MSW server (`listen`/`resetHandlers`/`close`). `src/test/server.ts` exports the server; `src/test/renderWithProviders.tsx` exports `buildQueryWrapper()`.
- **A test always sits right beside the file it tests** — never in a separate tests folder, never at the feature root. The feature root stays clean (`view`, `view-model`, `model` only). A store's unit test lives next to the store (`chat.store.test.ts` beside `chat.store.ts`); a feature's integration test lives next to the root View it renders (`ChatView.integration.test.tsx` beside `ChatView.tsx`). Name the file after its subject + `.test.ts` (unit) or `.integration.test.tsx` (integration).

```tsx
// ChatView.integration.test.tsx (beside ChatView.tsx) — render the feature, type, await the streamed reply
render(<ChatView />);
fireEvent.change(screen.getByPlaceholderText("Escreva uma mensagem..."), { target: { value: "Oi" } });
fireEvent.keyDown(screen.getByPlaceholderText("Escreva uma mensagem..."), { key: "Enter" });
expect(await screen.findByText("Oi")).toBeInTheDocument();
```

## Page layout

**Every new page uses `BaseLayout`** (`shared/ui`) by default — sidebar on the left, content in an inset main panel (small gap + rounded corners; the shell behind it shares the sidebar's background, Linear-style). Only skip it when the user asks or a use case genuinely needs a different shell (e.g. full-bleed) — and then it's an intentional, stated exception.

```tsx
<BaseLayout sidebar={<ConversationSidebar />}>
  <FeatureView />
</BaseLayout>
```

The **`Sidebar`** is a shared, composable shell (`shared/ui`), reusable on any page: `Sidebar` (the aside) + `SidebarHeader` (identity), `SidebarSection` (labeled group), `SidebarItem` (nav row). Feature-specific data/actions (the conversation list, "Nova conversa") stay in the feature and *compose* these pieces — the sidebar feels like a real navbar because it carries an identity header + labeled sections, not a lone floating button.

## Design & styling

Think like a designer making deliberate decisions — these are principles, not fixed values. Tune the actual numbers per screen and verify the result visually. Use **Tailwind v4** with **lucide-react** as the *only* icon set.

- **No pure white or pure black.** Pure `#fff`/`#000` feels harsh; pull surfaces slightly off the extremes so the UI feels softer and intentional.
- **Work in HSL and define a small lightness scale.** Pick a base hue and saturation, then derive surfaces by stepping lightness in consistent increments. Keep hue and saturation stable across the scale so everything reads as one palette.
- **Use lightness to express elevation/hierarchy, not decoration.** Each layer (page → panel → card → raised element) shifts lightness one step; the step size is a design choice, kept consistent. Don't pick a layer's value at random per component.
- **Text is a contrast decision, not a single token.** Choose text lightness against its actual background to hit a comfortable, accessible contrast (mind WCAG); primary text is stronger, secondary/muted text is softer.
- **Design for light and dark from the start** by inverting the lightness scale rather than hand-picking unrelated colors.

## Loading states (skeletons)

Every async fetch shows a **`Skeleton`** placeholder while it loads — never a flash of empty state. The `Skeleton` (`shared/ui`) wraps the external `react-loading-skeleton` behind a **port + adapter injected via context** (DIP): the only file importing the lib is `react-loading-skeleton.adapter.tsx`, so swapping libs touches one file and no consumer. Inject a fake renderer with `<SkeletonProvider>` (the lib is swappable, tests prove it). Build a purpose-shaped skeleton per surface (e.g. `conversation-list-skeleton.tsx`) sized like the real content, and show it only on the **initial** load (`isLoadingX && items.length === 0`) so refreshes don't flicker.

**Zero layout shift is the bar.** A skeleton must occupy the *exact* box of the content it stands in for — same width, height, border-radius, padding and gaps — so nothing jumps when the real content arrives. Measure the real element (e.g. a `text-sm` + `py-2` row is 36px; the select trigger is 38px) and mirror it; reuse the consumer's own container so paddings/gaps aren't duplicated, and render N **sibling** skeletons (not the lib's `count`) when the parent already spaces children with `gap`. The adapter forces the skeleton to `display:block` and kills the line-height baseline gap, so a placeholder never sits a few pixels lower than its content.

## User feedback (notifications & tooltips)

Native, no external libs. Both in `shared/ui`, built with the Composition pattern (Root + Zustand store). Themed tokens in `globals.css`: `success · danger · warn · info` (+ `-ink`). Messages are **friendly and in Portuguese**; never leak server internals (a missing env is a 500 → generic message).

**Notifications** — outcome popups. Mounted once via `<NotificationViewport />` in the layout; fired from ViewModels with `notify`:

```ts
notify.success("Conversa salva");
notify.danger("Não foi possível obter a resposta da IA");
```

Each toast: themed variant, **copy**, optional **Reverter** action, **close**, and an inverse progress bar (square, bottom edge, drains over the duration). It **slides in** and **slides back out** when the bar finishes (animations in `notification-toast.module.css`; one `slide` keyframe, direction set by a CSS var). Auto-dismiss via the reusable `useAutoDismiss` hook (default **4000ms**; hover pauses bar + timer). The viewport takes two props: `position` (which corner) and `enterFrom` (which edge it slides from) — `<NotificationViewport position="bottom-right" enterFrom="right" />`. Store caps visible toasts. Use `success` to confirm a *domain outcome* (not trivial UI state), `danger` for real failures.

**Tooltips** — `Tooltip` with `placement` (`top|bottom|left|right`); renders nothing when `label` is falsy, so pass the reason conditionally. **Every disabled control must say why** — the wrapper captures hover even over disabled elements:

```tsx
<Tooltip label={disabled ? "Comece uma nova conversa para enviar" : undefined}>
  <button disabled={disabled}>Enviar</button>
</Tooltip>
```
