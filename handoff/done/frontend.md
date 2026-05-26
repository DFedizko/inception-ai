# Handoff — Frontend: real gateway + multi-conversation chat

You evolve the **chat feature** from the mocked experiment into a real client of the backend API, with a conversation **sidebar** and streamed replies. Read `handoff/README.md` (orchestration + **API contract** — binding) and `src/features/CLAUDE.md` (MVVM, store/hook split, gateways, testing) before coding.

**You own only:** `src/features/chat/**`, `src/features/shared/http/**`, `src/app/page.tsx`, `src/app/layout.tsx`. **Never touch** `src/bounded-contexts/**`, `src/app/api/**`, `package.json`/`bun.lock` (all your deps already exist — `zustand`, `lucide-react`, RTL + happy-dom), `tsconfig.json`, `bunfig.toml`, `globals.css`, test-setup files.

## Goal

Replace the mock gateway with a real HTTP gateway that talks to the contract endpoints, and grow the feature to list conversations (sidebar), open one, and send messages with token-by-token streaming — keeping the MVVM split intact (store = state + setters; ViewModel hook = logic + setters; View = reads state, never setters).

## Step 0 — align the feature with the domain, WITH THE USER (hard gate, before any test or code)

Per the root `CLAUDE.md` order, **do not write tests or code until the model is validated with the user.** The frontend is *derived from* the domain, so confirm with the user the feature behaviors that flow from it (stay consistent with the agreed ubiquitous language — same `Conversation`/`Message`/`Type`/`Title`), e.g.:
- Sidebar: ordering (newest first?), what a conversation with no title yet shows, how "new conversation" behaves.
- Streaming UX: what the user sees while the reply streams, and on a mid-stream failure (keep partial text? show an error?).
- When the derived **Title** appears in the sidebar (it arrives only after the stream completes — per contract).

Agree the behaviors first, then tests → code.

## Build against fakes — no running backend needed

Keep the **existing mock gateway as the injected default** until the integration checkpoint. Implement the real gateway behind the **same port** and test it with a mocked `fetch`/`ReadableStream`. You can finish and ship green without the backend up.

## TDD order (test-first; co-locate each test beside its file)

1. **Generic HTTP client (frontend shared)** (`src/features/shared/http/**`) — **our first implementation of this; build it fully generic and typed.** A `HttpClient` **port** + a `fetch` adapter. This is its **own** client, independent from the backend's (duplication across layers is accepted; never import across layers). Requirements:
   - **All HTTP methods:** `get`, `post`, `put`, `patch`, `delete` (add `head`/`options` if trivial).
   - **TypeScript generics done well** — request body and response are type parameters, e.g. `get<TResponse>(url, config?): Promise<TResponse>`, `post<TResponse, TBody = unknown>(url, body: TBody, config?): Promise<TResponse>`. No `any` in the public surface.
   - **Config object:** headers, query params, `AbortSignal`, base URL.
   - **Streaming / readers:** a first-class way to consume a streamed response body — e.g. `stream(url, config?): AsyncIterable<string>` decoding chunks via `response.body.getReader()` + `TextDecoder`. The gateway's `streamAssistantReply` depends on this.
   - Adapters/gateways depend on the **port**, never on `fetch` directly. Unit-test the adapter with a mocked `fetch` (including a fake `ReadableStream` for the streaming path).
2. **Model** (`src/features/chat/model/**`) — extend read models if needed so a `Conversation` carries `title`, `createdAt`, and `messages` (mirror of `ConversationDTO`; no behavior).
3. **Gateway** (`src/features/chat/view-model/gateways/`)
   - Keep the port focused (ISP). Add the methods the feature needs, mapping **DTO → read model**:
     - `listConversations()` → `ConversationSummary[]`
     - `startConversation()` → `Conversation`
     - `getConversation(id)` → `Conversation`
     - `streamAssistantReply(conversationId, content)` → `AsyncIterable<string>` (consumes the streamed `text/plain` body)
   - Implement `conversation.http.gateway.ts` against the port using the shared `HttpClient`; depend on the **port**, not on `fetch` directly. Keep `conversation.mock.gateway.ts` for tests/dev.
   - Test the http gateway with a fake `HttpClient`/mocked `fetch`: assert correct URLs/bodies per the contract and correct DTO→read-model mapping and chunk yielding.
4. **Store** (`src/features/chat/view-model/stores/`) — state + setters only, no logic. Hold `conversations` (sidebar), `activeConversationId`, `messages`, `isReplying`. Add setters. Unit-test the setters.
5. **ViewModel hook** (`src/features/chat/view-model/useChatViewModel.ts`) — all logic; imports setters via **destructuring**; loads the gateway. Handlers: `loadConversations`, `openConversation(id)`, `startConversation`, `sendMessage(content)`. `sendMessage` appends the user message + an empty assistant message, consumes `streamAssistantReply`, appends chunks to the assistant message, then on completion calls `loadConversations` to refresh the sidebar/derived **Title** (the title is **not** in the stream — per contract).
6. **View** (`src/features/chat/view/**`) — components read **state** from the store via destructuring; behavior from the hook. Add a **sidebar** component listing conversations (open / start new) beside the existing `ChatScreen`. Keep one component per file, kebab-case; reuse the existing composer/message-list/bubble/typing-indicator.
7. **Page** (`src/app/page.tsx`) — thin composition mounting the chat feature (and sidebar). No UI logic.
8. **Integration test** (`ChatScreen.integration.test.tsx`, beside `ChatScreen.tsx`) — render the feature with a **fake gateway**, type, await the streamed reply, assert the sidebar updates. RTL + happy-dom, role/text queries.

## Gateway injection (the integration seam)

Inject the gateway in one place (where `useChatViewModel` constructs it today). Default to the **mock** during parallel dev; at the **integration checkpoint** (README), switch that single line to `conversation.http.gateway.ts`. No other change should be needed if you coded to the port.

## Definition of done

- Feature behaviors aligned **with the user** before tests/code (Step 0).
- Run `bun test` continuously; each behavior covers **success and error/edge scenarios** (empty/blank input ignored, list/open with zero conversations, stream completes, **mid-stream failure** keeps partial text or shows the agreed error state).
- `bun test` fully green: http client adapter, http gateway mapping, store setters, viewmodel logic, feature integration test (all against fakes — no network).
- `bun run build` passes. No imports from `src/bounded-contexts/**` or `src/app/api/**`; the feature talks to the backend **only through routes** via the gateway.
- MVVM rules hold: setters only inside the ViewModel hook; components/View/page read state via destructuring and never import setters.
- UI: send a message → reply streams in; conversations show in the sidebar; opening one loads its messages. (End-to-end with the real backend happens at the integration checkpoint.)
- **When all of the above hold and the suite is green, move this file (`handoff/frontend.md`) into `handoff/done/`.**
