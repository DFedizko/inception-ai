# Track 3 — Frontend: reusable Select component

Read `handoff/README.md` (orchestration + **component contract** — binding) and `src/features/CLAUDE.md` first.

**You own only:** `src/features/shared/ui/**`. **Never touch** `src/features/chat/**`, `src/features/shared/hooks/**`, the backend, configs, test setup. No new deps (use `lucide-react`, already present).

## Goal

A **beautiful, reusable, accessible Select** design-system primitive that any feature can use — the model/mode selectors (track 5) are built on it. Pure presentation: props in, selection out, **no domain knowledge**.

## Step 0 — confirm UX WITH THE USER (hard gate)

The component is derived from how the product should feel. Ask before coding, e.g.:
- Native `<select>` styled, or a custom listbox popover? (Custom gives full styling + matches modern chat UIs — confirm.)
- Single-select only now, or also multi-select later? Searchable?
- What does an option show — label only, or label + secondary text/icon (useful for models)? Disabled options?
- Sizes/variants needed? Behavior on empty options / loading?

Search modern chat UIs for inspiration; agree the API and look, then tests → code.

## TDD order (test-first; RTL + happy-dom; co-locate tests beside files)

1. Define the **typed API** per the contract: generic over option value, controlled (`value`, `onChange`), `options: { value; label; disabled? }[]`, label/placeholder, disabled, loading/empty states.
2. **Integration test first** (RTL): open the control, see options, select one → `onChange` fires with the value; keyboard nav (arrows/enter/escape) and ARIA roles; disabled option not selectable; empty/loading states render.
3. Implement with the **Composition pattern** (Root + pieces in their own files, isolated imports — no props-pocalypse, no dot-notation bundle). Style with project **HSL tokens** + a `lucide-react` chevron; design for light/dark.
4. Keep it **domain-agnostic** — no "model"/"mode" wording inside; those labels come from the consumer.

## Definition of done

- UX validated with the user (Step 0).
- `bun test` green continuously; cover success + edge (keyboard selection, disabled options, empty/loading, controlled updates).
- Accessible (roles, keyboard), composition-based, styled with project tokens, light/dark.
- `bun run build` passes; nothing edited outside `src/features/shared/ui/**`.
- **When green and DoD holds, move this file to `handoff/done/`.**
