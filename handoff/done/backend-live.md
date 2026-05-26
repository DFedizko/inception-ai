# Track 1 — Backend: live token, turn persistence, remove turn-based voice

Read `handoff/README.md` (orchestration + contract — binding) and `src/bounded-contexts/CLAUDE.md` first.

**You own only:** `src/bounded-contexts/conversation/**`, `src/app/api/conversations/**`, `src/app/api/live/**`, `.env.example`, `package.json`/`bun.lock`. **Never touch** `src/features/**`, `src/app/api/models/**`, the model-catalog context, configs, test setup.

## Goal

Switch voice from the hand-rolled STT→LLM→TTS pipeline to **Gemini Live (native audio)** with **ephemeral tokens**. The browser connects to Gemini directly, so your job is: (1) mint tokens, (2) persist the turns the client reports back, (3) **delete** the over-engineered pipeline. Text mode stays as is.

## Step 0 — model WITH THE USER (hard gate)

Ask before coding, e.g.:
- Persistence: the client talks to Gemini directly, so the server only sees turns **after** the exchange. Do we persist after each user/assistant turn, or at session end? What if the user closes mid-session?
- What content is stored for a voice turn — the Live API **transcript**? Both input and output transcripts?
- Does the live session need prior **conversation history** for context (sent by the client at connect), and does that change what the server must provide?
- Token scope/lifetime, and what model id the token is locked to.
- Confirm the **native-audio model id** + **ephemeral-token API** (`ai.authTokens.create` / AuthTokenService) against the official **Ephemeral tokens** and **Live API** docs.

## TDD order (test-first, `bun test`; fakes only — never real API)

1. **Remove the turn-based pipeline** (delete + drop their DI bindings & tests):
   - `application/ports/speech-provider.ts`, `application/ports/speech-to-text.ts`
   - `infrastructure/ai/speech-provider.gemini.ts` (+fake/test), `infrastructure/ai/speech-to-text.gemini.ts` (+fake/test), `infrastructure/audio/pcm-to-wav.ts` (+test)
   - `domain/value-objects/audio-clip.value-object.ts` (+test); keep `voice.value-object.ts` only if Step 0 still needs a server-side voice name, else remove
   - `application/use-cases/speak-reply.use-case.ts` (+test), `presentation/dto/voice-reply.dto.ts`
   - `app/api/conversations/[id]/voice-replies/route.ts`, `app/api/conversations/audio-streaming-response.ts`
   - Remove `SpeechProvider`/`SpeechToText` bindings + `GEMINI_TTS_MODEL`/`GEMINI_TRANSCRIPTION_MODEL` from `.env.example`.
2. **Live token** — an `IssueLiveToken` use case depending on a **`LiveTokenProvider` port**; returns `{ token, expiresAt, model }`. Infra adapter mints it via the SDK (ephemeral token scoped to the live model + v1alpha). Fake provider for tests. Route `src/app/api/live/token/route.ts` (`POST`) resolves the controller from DI and returns the contract JSON.
3. **Persist turns** — a `RecordTurns` (intention-named) use case: load the aggregate, append the reported user/assistant turns (validating turn-order invariants), derive Title on the first user message, persist → return the conversation. Reuse the existing repository/Title policy. Route `src/app/api/conversations/[id]/turns/route.ts` (`POST`) per contract; Zod-validate the body (reject empty/invalid → 400; unknown id → 404).
4. **Controller + DI** — add `issueLiveToken` and `recordTurns` controller methods (framework-free, Zod, JSON envelope); bind the new use cases + `LiveTokenProvider` in `di.ts`; remove the deleted bindings.

## Definition of done

- Feature/persistence validated with the user (Step 0).
- `bun test` green continuously; cover success + error/edge (token mint failure → 500, invalid/empty turns → 400, unknown conversation → 404, first-turn Title derivation, turn-order invariants).
- `POST /api/live/token` and `POST /api/conversations/:id/turns` match the contract; the turn-based voice pipeline and its tests are **gone**; text endpoint unchanged.
- `bun run build` passes; no Next.js imports under `src/bounded-contexts/**`.
- With a real key, a minted token lets a client open a live session, and reported turns persist (Title updates).
- **When green and DoD holds, move this file to `handoff/done/`.**
