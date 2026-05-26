# Track 5 — Frontend: chat voice modes & selectors

Read `handoff/README.md` (orchestration + **all contracts** — binding) and `src/features/CLAUDE.md` first.

**You own only:** `src/features/chat/**`. **Never touch** `src/features/shared/**` (you *consume* track 3's Select and track 4's audio hooks), the backend, `src/app/**`, configs, test setup. No new deps.

## Goal

Let the user choose, per turn, **how** they converse, inside the chat feature:
- **Text mode** (existing) — type → text reply.
- **Voice mode** — a control in the composer switches on voice; the AI reply is **spoken**. Input is **typed (text-to-voice)** or **mic (voice-to-voice)**.
- A **model selector** (built on track 3's shared `Select`) populated from `GET /api/models`, filtered by the active mode's capability; the chosen model is sent with requests.

Keep MVVM intact (store = state + setters; ViewModel hook = logic + setters + gateways; View reads state via destructuring, never setters).

## Step 0 — model the feature WITH THE USER (hard gate)

Ask before coding, e.g.:
- Where do the mode toggle and model selector live in the composer? Inspiration from modern chat UIs (a mic button + a small model dropdown)?
- Is mode/model **per turn** or a sticky setting for the conversation? Default?
- Voice-to-voice UX: hold-to-talk in the composer, what's shown while recording, and while the reply plays?
- When does the spoken text/transcript appear in the thread (after playback, via refetch — per contract)? Show a "speaking…" state?
- Behavior when the selected model lacks a capability for the chosen mode (disable the mode, or filter models)?

Stay consistent with the agreed ubiquitous language (`Conversation`/`Message`/`Type`). Then tests → code.

## TDD order (test-first; co-locate beside files; build against fakes/stubs — no backend, no real shared deps yet)

1. **Model** — extend read models if needed (a turn already carries `Type = text|voice`). Add a `Model`/`ModelInfo` read model mirroring `GET /api/models`.
2. **Gateways** (`view-model/gateways/`) — extend the gateway port + http adapter (map DTO→read model), depending only on the shared `HttpClient` port:
   - `listModels()` → `ModelInfo[]` (from `GET /api/models`).
   - `streamSpokenReply(conversationId, input, model?)` → audio stream, consuming `POST /api/conversations/:id/voice-replies` (text or audio input per contract). Keep the existing text `streamAssistantReply`.
   - Test with mocked `fetch`/`ReadableStream`: correct URLs/bodies and mapping.
3. **Store** (`view-model/stores/`) — add state + setters: `mode` (`text`|`voice`), `inputKind` (`text`|`audio`), `selectedModelId`, `models`, plus playing/recording flags. Unit-test setters.
4. **ViewModel hook** — all logic; imports setters via destructuring; loads gateways and the **audio hooks** (track 4). Handlers: `loadModels`, `selectModel`, `setMode`, `sendText` (existing), `speakFromText`, `speakFromVoice` (record→send→play). On completion, refetch conversation/list (title/transcript per contract).
5. **View** — composer gains a **mode/voice control** and a **model selector** built on track 3's `Select` (filter `models` by the active mode's capability). Components read state via destructuring; behavior from the hook. One component per file, kebab-case.
6. **Integration test** (`ChatView.integration.test.tsx`) — with a **fake gateway** + **stubbed audio hooks/Select**: switch to voice mode, pick a model, text-to-voice triggers audio playback; voice-to-voice records→plays; text mode still streams text; selector lists only capable models.

## Consuming the other tracks (integration seam)

Code against the **contract signatures** for `Select` (track 3) and the audio hooks (track 4); stub them locally to develop/test. At the **integration checkpoint**, import the real `@/features/shared/ui` Select and `@/features/shared/hooks` audio hooks, and point gateways at the live endpoints. The injection point stays single (the gateway provider).

## Definition of done

- Feature validated with the user (Step 0).
- `bun test` green continuously; cover success + edge (text mode unchanged, text-to-voice plays, voice-to-voice records→plays, mid-stream/audio failure handled, selector filters by capability, empty model list).
- MVVM rules hold (setters only in the hook; View reads state via destructuring).
- `bun run build` passes; only `src/features/chat/**` edited; talks to the backend only through routes via gateways.
- **When green and DoD holds, move this file to `handoff/done/`.**
