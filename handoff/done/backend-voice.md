# Track 1 — Backend: voice replies (text-to-voice & voice-to-voice)

Read `handoff/README.md` (orchestration + contract — binding) and `src/bounded-contexts/CLAUDE.md` first.

**You own only:** `src/bounded-contexts/conversation/**`, `src/app/api/conversations/**`, `.env.example`, `package.json`/`bun.lock`. **Never touch** other tracks' folders, `src/app/api/models/**`, `src/features/**`, configs, test setup.

## Goal

Add a **voice reply** capability to the `conversation` context: a turn whose assistant reply is **spoken audio**, with input either typed (text-to-voice) or spoken (voice-to-voice). Expose it via `POST /api/conversations/:id/voice-replies` exactly per the contract. Keep the existing text endpoint untouched.

## Step 0 — model WITH THE USER (hard gate)

Ask before coding, e.g.:
- Is voice-to-voice **turn-based** (record → reply) for the MVP, or must it be full-duplex realtime (Live API + WebSocket — flag the orchestrator if so)?
- For audio input, do we **transcribe** the user audio to store text, send audio straight to a multimodal model, or both? What is persisted as the user turn's content?
- Which voice(s)/voice config do we expose, and is `voice` per-request or a setting?
- On a provider failure mid-utterance, what's persisted — nothing, or a partial assistant turn?
- Does `Type = voice` attach to the assistant turn always, and to the user turn only when input is audio?

Confirm the model IDs against the **official Gemini models page** (TTS / native-audio / live). Extend the ubiquitous language as needed, then tests → code.

## TDD order (test-first, `bun test`; fakes only — never the real API)

1. **Domain** — the `Type` VO already supports `voice`; add any new invariants the user agreed (e.g. an assistant voice turn still follows a pending user turn). Keep behavior in the aggregate.
2. **Application** — a `SpeakReply` (or similar intention-named) use case: load aggregate → record the user turn (text or transcribed) → derive Title if first → ask an **`SpeechProvider` port** to produce spoken audio for the reply, pushing audio chunks via callback (no generators — backend rule) → persist the assistant turn when done. Depends on ports, not adapters. Unit-test with a **fake `SpeechProvider`** (and fake repo).
3. **Infrastructure** — Gemini adapter(s) implementing the speech port using `@google/genai` (TTS via `generateContent` with `responseModalities:["AUDIO"]` and/or native-audio; for audio input, the multimodal/transcription path you agreed). Provide a **fake** so tests never hit the paid API. If full-duplex Live is in scope, isolate it behind its own port/adapter.
4. **Presentation** — extend the `conversation` controller with a `speakReply` method: validate the `{ input, model?, voice? }` body with Zod (text vs audio union; reject bad `mimeType` → 415), return a `ReadableStream` of audio chunks; map errors to the JSON envelope.
5. **Route** — `src/app/api/conversations/[id]/voice-replies/route.ts`: thin driving adapter resolving the controller from the container, returning the audio stream with `Content-Type: audio/*`. Register the new use case + any new port binding in the context's `di.ts`.

## Env & deps

If a model id needs configuring, add `GEMINI_TTS_MODEL` / `GEMINI_LIVE_MODEL` to `.env.example` with documented defaults (verify IDs first). You are the **only** track allowed to add a dependency — but prefer none (`@google/genai` covers TTS/Live).

## Definition of done

- Domain/feature validated with the user (Step 0).
- `bun test` green continuously; cover **success and error/edge** (invalid input → 400, unknown id → 404, bad `mimeType` → 415, provider failure, first-message Title, text-input vs audio-input paths).
- `POST /api/conversations/:id/voice-replies` matches the contract (audio stream out, turns persisted, `Type` set correctly); existing text endpoint unchanged.
- `bun run build` passes; no Next.js imports under `src/bounded-contexts/**`.
- With a real key, both text-to-voice and voice-to-voice produce audible replies and persist the turns.
- **When green and DoD holds, move this file to `handoff/done/`.**
