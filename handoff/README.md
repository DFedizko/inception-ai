# Handoff — Conversational voice via Gemini Live API (orchestration)

**Multiple agents work this milestone in parallel** — each picks one track. Read this first, then `handoff/CLAUDE.md` (how handoffs are designed), then your track. The text-chat and the previous voice milestone are in `handoff/done/` (history).

## Why this milestone

The previous voice work was **over-engineered**: it hand-rolled a turn-based pipeline `audio → STT → text LLM → TTS → audio` (separate `SpeechToText` + `SpeechProvider` + `audio-clip`/`voice` VOs + `pcm-to-wav`). Gemini already provides **native conversational audio** via the **Live API** (model `gemini-2.5-flash-native-audio-preview-12-2025`, **free tier**, bidirectional voice↔voice). We replace the hand-rolled pipeline with the Live API.

**Transport decision (made by the orchestrator — verified against docs):** use **ephemeral tokens**, *not* a WebSocket proxy. The backend mints a short-lived token (`@google/genai` AuthToken / `ai.authTokens.create`); the **browser connects the Live WebSocket directly** to `generativelanguage.googleapis.com` (v1alpha) with `ai.live.connect({ apiKey: token })`. So the server needs only a normal `POST` token endpoint — no WebSocket in Next route handlers. Confirm the exact SDK calls against the official **Ephemeral tokens** + **Live API** docs before coding.

## Process gate (every agent, before any code)

Root `CLAUDE.md` order is a hard gate: **1) model the feature *with the user* (business questions first) → 2) tests → 3) code.** No tests/code until validated. Use **Bun**; tests never hit the real Gemini API (inject fakes).

## How it works (target)

- **Text mode** — unchanged: `POST /api/conversations/:id/messages`, server-side text stream, persisted.
- **Voice mode** — the browser opens a **Live session** directly with Gemini using an ephemeral token. Input is mic audio (voice-to-voice) **or** typed text sent into the session (text-to-voice); output is **streamed native audio**. The Live API also returns **input/output transcriptions**, which the client sends back to the server to **persist the turns** (so conversations are still stored and the Title is derived).

## Tracks

| # | Track | File | Owns (create/edit ONLY here) |
|---|---|---|---|
| 1 | Backend · live token + persistence + cleanup | `backend-live.md` | `src/bounded-contexts/conversation/**`, `src/app/api/conversations/**`, `src/app/api/live/**`, `.env.example`, `package.json`/`bun.lock` |
| 2 | Frontend · streaming audio hooks | `frontend-live-audio.md` | `src/features/shared/hooks/**` |
| 3 | Frontend · chat live session + selector fix | `frontend-chat-live.md` | `src/features/chat/**` |

**Hard rules to stay conflict-free:**
- Only **track 1** touches `package.json`/`bun.lock` and `.env.example`. We expect no new deps (`@google/genai` already supports `live` + auth tokens; audio is native Web Audio).
- No frontend track touches `src/app/**`; no backend track touches `src/features/**`. Tracks 2 & 3 own disjoint frontend folders.
- Nobody touches `tsconfig.json`, `bunfig.toml`, `globals.css`, test setup, or another track's folder.
- **Removals are scoped to the owner**: track 1 deletes the backend turn-based pipeline; track 3 deletes the frontend turn-based voice code; track 2 replaces the turn-based hooks. Don't reach into another track's files to delete.

## Build independently; integrate at the checkpoint

Each track ships green against fakes/stubs and the contract. **Checkpoint:** with a real `GEMINI_API_KEY` in `.env.local`, voice mode mints a token, the browser streams mic→Gemini→speaker live, and turns persist (sidebar/title update); text mode unchanged.

---

## Contract (single source of truth)

### Existing — STABLE, do not change
- `GET /api/conversations` · `POST /api/conversations` · `GET /api/conversations/:id`
- `POST /api/conversations/:id/messages` `{ content, type:"text" }` → text stream (text mode)

### New — live token (track 1 → consumed by track 3)
- `POST /api/live/token` → `200 { token: string; expiresAt: string; model: string }`
  - Mints an ephemeral token scoped to the native-audio live model and the v1alpha Live endpoint. The browser uses `token` as the apiKey for `ai.live.connect`. `model` is the live model id the client must request.
  - errors: JSON envelope; `500` if the provider/token mint fails.

### New — persist live turns (track 1 → consumed by track 3)
- `POST /api/conversations/:id/turns` → body `{ turns: TurnInput[] }`, `TurnInput = { role: "user"|"assistant"; type: "text"|"voice"; content: string }`
  - Appends the turns from a completed live exchange (content = the Live API transcripts). Derives the **Title** from the first user message (same policy). Enforces existing turn-order invariants. → `200 ConversationDTO`.
  - errors: `400` invalid · `404` unknown conversation · `500`.

### Removed — the turn-based voice pipeline
`POST /api/conversations/:id/voice-replies` and all STT/TTS code are **deleted** (see track 1 & 3 removal lists). The frontend no longer calls a server voice endpoint for audio.

### Model capability (already in catalog)
`GET /api/models` already returns `capabilities` incl. `"live"` (derived from the `bidiGenerateContent` action). Voice mode requires the selected model's `"live"` capability. Track 1 (or whoever) **verifies** the native-audio model is tagged `live`; track 3 filters the selector by it.

## Live session contract (track 3 ↔ track 2)

- Audio formats per Live API docs (confirm): input **16-bit PCM, 16 kHz, mono**; output **PCM 24 kHz**. Track 2's hooks capture/playback at these rates as streaming frames.
- Track 3 orchestrates: fetch token → `ai.live.connect` → pipe mic frames (from track 2 recorder) up → play output frames (track 2 player) → collect transcripts → `POST /turns`.
- Track 3 codes against track 2's hook signatures (below) and stubs them until integration.

## Audio hooks contract (track 2 → consumed by track 3)

Streaming hooks in `src/features/shared/hooks/` (replace the old turn-based base64 ones):
- `useMicStream()` → start/stop; emits PCM16 frames (e.g. via a callback/async iterable) at 16 kHz for the live session.
- `useAudioSink()` → enqueue/play streamed PCM frames (24 kHz) with start/stop + playing state; smooth gapless playback.
- Generic, domain-agnostic; tested with mocked Web Audio.

## Env (track 1 owns `.env.example`)
- `GEMINI_API_KEY` (existing). `GEMINI_LIVE_MODEL` override (default a current native-audio model, e.g. `gemini-2.5-flash-native-audio-preview-12-2025` — **verify** the current id + free-tier on the official models page).
- Remove the now-unused `GEMINI_TTS_MODEL` / `GEMINI_TRANSCRIPTION_MODEL` entries.
