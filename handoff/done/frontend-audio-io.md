# Track 4 — Frontend: audio I/O hooks

Read `handoff/README.md` (orchestration + **audio I/O contract** — binding) and `src/features/CLAUDE.md` first.

**You own only:** `src/features/shared/hooks/**`. **Never touch** `src/features/chat/**`, `src/features/shared/ui/**`, the backend, configs, test setup. No new deps (use native Web APIs: MediaRecorder, Web Audio / `HTMLAudioElement`).

## Goal

Generic, domain-agnostic hooks for **capturing microphone audio** and **playing audio replies**, used by the chat voice UI (track 5). These are reusable presentation tools (not a ViewModel) that live in `shared/hooks`.

## Step 0 — confirm behavior WITH THE USER (hard gate)

Ask before coding, e.g.:
- Recording UX: press-and-hold vs tap-to-start/tap-to-stop? Any max duration / silence auto-stop?
- Output audio format/`mimeType` to request from MediaRecorder (must match what the backend `AudioInput` accepts — coordinate via the contract).
- Playback: autoplay the reply when it arrives? Allow stop/replay? Show playing state/levels?
- Permission/denied and unsupported-browser handling.

Agree behavior, then tests → code.

## TDD order (test-first; RTL + happy-dom; co-locate tests beside files)

1. Define the **contract signatures**:
   - `useAudioRecorder()` → `{ isRecording, start(), stop(): Promise<{ audio: string /*base64*/, mimeType: string }>, error }`.
   - `useAudioPlayer()` → `{ isPlaying, play(source: Blob | ReadableStream | string), stop(), error }`.
2. **Test first** with mocked Web APIs (stub `navigator.mediaDevices.getUserMedia`, `MediaRecorder`, `HTMLAudioElement`/Web Audio): start→stop yields base64 + mimeType; play sets `isPlaying` then clears on end; permission-denied and unsupported paths set `error` without throwing.
3. Implement the hooks against the mocks; keep them **generic** (no chat/domain wording).

## Definition of done

- Behavior validated with the user (Step 0).
- `bun test` green continuously; cover success + edge (record→base64, playback lifecycle, permission denied, unsupported API).
- Hooks are domain-agnostic and match the contract signatures.
- `bun run build` passes; nothing edited outside `src/features/shared/hooks/**`.
- **When green and DoD holds, move this file to `handoff/done/`.**
