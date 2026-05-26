# Track 3 — Frontend: chat live voice session + selector fix

Read `handoff/README.md` (orchestration + **all contracts** — binding) and `src/features/CLAUDE.md` first.

**You own only:** `src/features/chat/**`. **Never touch** `src/features/shared/**` (you *consume* the streaming audio hooks), the backend, `src/app/**`, configs, test setup. No new deps (`@google/genai` already present for the browser Live client).

## Goal

Replace the turn-based voice UI with a **Live API session**: in voice mode the browser fetches an ephemeral token, opens `ai.live.connect` directly to Gemini, streams mic audio (via track 2's `useMicStream`) up and plays native audio (`useAudioSink`) down, then persists the resulting turns via `POST /api/conversations/:id/turns`. Also fix the **model selector** (the reason voice was unreachable). Text mode unchanged. Keep MVVM intact.

## Step 0 — model the feature WITH THE USER (hard gate)

Ask before coding, e.g.:
- Voice UX: open-mic while in voice mode vs push-to-talk; what's shown while listening/speaking; barge-in?
- Text-to-voice: typing in voice mode sends the text **into the live session** (hear the reply) — confirm vs a separate path.
- Does the session get prior conversation **history** at connect (for context)? When exactly do we `POST /turns` (per turn / at session end)?
- Selector: filter options by the active mode's capability (voice ⇒ models with `"live"`; text ⇒ `"text"`), and what the sensible **default** per mode is.

## Known bugs to fix (root-caused already)

- **Selector lists ALL models unfiltered** and the default is a text model, so voice mode never enables. Filter `models` by capability for the mode, and pick a capable default. (The empty/disabled selector in the running app was *also* caused by a missing `GEMINI_API_KEY` — that's an env/ops fix, not code.)
- The old `streamSpokenReply` gateway used raw `fetch` instead of the injected `HttpClient` — remove it with the rest of the turn-based path.

## TDD order (test-first; co-locate beside files; build against fakes/stubs)

1. **Remove turn-based voice**: `gateway.streamSpokenReply`, its DTO/types, and any turn-based audio orchestration in the viewmodel; drop `voice-status` bits tied to the old flow (or repurpose).
2. **Gateways** — add (mapping DTO→read model, via the shared `HttpClient` port): `issueLiveToken()` → `{ token, expiresAt, model }`; `recordTurns(conversationId, turns)` → updated conversation. Keep `listModels()` and text `streamAssistantReply`. Test with mocked `fetch`.
3. **Live session** — a `view-model/live/` module (class behind a port, per the adapters rule) that wraps `ai.live.connect`: connect with the token, send mic frames + text, receive audio frames + transcripts, surface lifecycle. Test against a **fake live client** (no network).
4. **Store** — state + setters for voice session: `mode`, `isListening`, `isSpeaking`, `liveStatus`, plus `models`/`selectedModelId`. Unit-test setters.
5. **ViewModel hook** — logic only; imports setters via destructuring; loads gateways + track 2 hooks + the live session. Handlers: `loadModels`, `selectModel`, `changeMode` (gate voice on `"live"` capability), `startVoice`/`stopVoice`, `sendTextToVoice`; on turn completion call `recordTurns` then refresh.
6. **View** — fix `model-selector` (filter by capability) and the mode toggle; voice UI shows listening/speaking; components read state via destructuring.
7. **Integration test** (`ChatView.integration.test.tsx`) with fake gateways + **stubbed** audio hooks + fake live client: switch to voice (only with a `live` model), session start streams/plays, turns persisted via `recordTurns`; selector shows only capable models; text mode still streams text.

## Consuming other tracks (integration seam)

Code against track 2's hook signatures (`useMicStream`/`useAudioSink`) and the contract endpoints; stub them to develop/test. At the checkpoint, import the real `@/features/shared/hooks` and point gateways at the live endpoints. Keep the single gateway injection point.

## Definition of done

- Feature validated with the user (Step 0).
- `bun test` green continuously; cover success + edge (voice gated on `live` capability, selector filtered + sensible default, session start/stop, text-to-voice, turn persistence, connect/permission failure, text mode unchanged).
- MVVM holds (setters only in the hook; View reads state via destructuring); turn-based voice code removed.
- `bun run build` passes; only `src/features/chat/**` edited; backend reached only through routes / the direct Live session.
- **When green and DoD holds, move this file to `handoff/done/`.**
