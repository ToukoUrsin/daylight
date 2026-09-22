# Validation — September 22, 2026

## Engine and build

- `npm test`: all 13 Node tests pass. They cover exact end-of-day deadlines, fractional same-day prerequisite handoffs, zero capacity/release restrictions, no overbooking, dependency order, cycles/missing/duplicate IDs, impossible release chains, malformed/oversized/unversioned replay imports, input bounds, shared random draws, deterministic recomputation and prototype-like imported task IDs.
- `npm run build` produces the dependency-free static output in `dist/`.
- Direct engine output for the synthetic example (seed 37, 1,600 simulations, likely effort 13.5h, available 17h), all deadlines met:
  - 30% essay scope cut: 51.25% → 93.5% (+42.3 points in the UI).
  - 2 extra hours on Wednesday: 51.25% → 96.06% (+44.8 points).
  - Problem set available one day earlier: 51.25% → 51.25% (0 points; the essay chain stays the constraint).
- These are simulation outputs from authored inputs, not measured student outcomes.

## Browser QA

Playwright 1.62 with Chromium (headless), against the local server, at 1440×1000 and 390×844. 43 of 43 scripted checks pass:

- No horizontal overflow on the default page, with the model disclosure open, in each change type, and in the changed schedule view.
- Schedule blocks stay inside each day track in both views and all three change types.
- Every control on the page and in both dialogs has an accessible name, checked in the Chromium accessibility tree.
- Task and hours dialogs open from the keyboard with focus inside. Tab stays within the modal. Escape closes them and focus returns to the control that opened them.
- The scope range keeps focus while its value changes from the keyboard.
- Apply makes the changed plan current (51% → 94% becomes the new current score) and shows Undo. Undo restores the previous state exactly.
- Export, then import in a fresh browser context, reproduces every score, per-task probability and explanation.
- Importing a replay with a dependency cycle is rejected with a cycle message. The prior plan stays on screen and survives a reload.
- With `localStorage` blocked, the page still renders the example and exports a replay.
- A 14-day imported plan with zero-hour days renders "Day off" columns without overflow.
- No console errors.

Visual review of the captured screens found three layout bugs. All are fixed:

- On mobile, dependency checkboxes stretched to full width and separated from their labels.
- On desktop, half-hour schedule blocks clipped their hours label.
- A tiny block held at its minimum height pushed the open-room block past the day track and over the "planned" label.

## Not verified

- Other browser engines (Firefox, Safari) and real mobile devices. Only Chromium was checked, at an emulated 390px width.
- Screen-reader output. Accessible names were checked in the accessibility tree, but no screen reader was run.
- Reduced-motion rendering.
- Number and date inputs follow the operating-system locale. On the recording machine they show "4,5" and "21.09.2026".

## Media

- `media/01-dashboard.png`, `media/02-essay-editor.png`, `media/03-schedule-and-model.png`: captured from the running app at 1440px width.
- `media/daylight-demo.mp4`: a 1:37 film at 1080p (H.264/AAC). Playwright drives the real app in real time, and the footage is captured with the Chromium screencast. It has no sped-up footage and no staged UI. The recording adds a pointer overlay so viewers can follow the mouse, plus a "synthetic example" caption and an end card. Narration is an ElevenLabs stock synthetic voice, and every number it states is shown by the app on screen. Captions are in `media/daylight-demo.en.srt`.
