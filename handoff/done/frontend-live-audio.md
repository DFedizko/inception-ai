# Track 2 — Frontend: streaming audio hooks for Live API

Read `handoff/README.md` (orchestration + **audio hooks contract** — binding) and `src/features/CLAUDE.md` first.

**You own only:** `src/features/shared/hooks/**`. **Never touch** `src/features/chat/**`, `src/features/shared/ui/**`, the backend, configs, test setup. No new deps (native Web Audio: `AudioContext`, `AudioWorklet`/`ScriptProcessor`, `getUserMedia`).

## Goal

Replace the previous **turn-based** audio hooks (record-to-blob / play-blob) with **streaming** hooks suited to the Live API: continuous mic capture as PCM16 frames, and gapless playback of streamed PCM output. Generic and domain-agnostic — track 3 wires them into the live session.

## Step 0 — confirm behavior WITH THE USER (hard gate)

Ask before coding, e.g.:
- Confirm Live API audio formats (input 16 kHz PCM16 mono, output 24 kHz PCM — verify against docs) and frame size/cadence.
- Mic UX: continuous open-mic while in voice mode, or push-to-talk? Barge-in (stop playback when the user speaks)?
- Playback: how to keep it gapless (jitter buffer)? Expose levels/visualizer?
- Permission-denied / unsupported-browser handling.

## TDD order (test-first; RTL + happy-dom; co-locate tests)

1. Remove the old turn-based hooks (`useAudioRecorder`, `useAudioPlayer`) and their tests.
2. Define the **contract signatures**:
   - `useMicStream()` → `{ isCapturing, start(onFrame: (pcm16: Int16Array) => void), stop(), error }` — emits 16 kHz PCM16 frames.
   - `useAudioSink()` → `{ isPlaying, enqueue(pcm: Int16Array /* 24 kHz */), start(), stop(), error }` — gapless playback queue.
3. **Test first** with mocked Web Audio (`AudioContext`, worklet/processor, `getUserMedia`): start→frames emitted; enqueue→playing then idle when drained; permission-denied/unsupported set `error` without throwing.
4. Implement against the mocks; keep generic (no chat/domain wording). Resample if the device rate ≠ target.

## Definition of done

- Behavior validated with the user (Step 0).
- `bun test` green continuously; cover success + edge (capture frames, playback lifecycle/drain, permission denied, unsupported API, rate mismatch).
- Hooks match the contract signatures; old turn-based hooks removed.
- `bun run build` passes; nothing edited outside `src/features/shared/hooks/**`.
- **When green and DoD holds, move this file to `handoff/done/`.**
