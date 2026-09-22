# Daylight

**A plan is a guess. Give it some daylight.**

Daylight is an uncertainty-aware student workload planner. Give tasks best, likely and worst duration estimates, real available hours, release dates, deadlines and prerequisites. Simulate the week, then compare one scope cut, earlier start or extra work block using the same random draws.

The original synthetic example has 13.5 likely work hours and 17 available hours. That apparently comfortable total hides deadline pressure: all deadlines are met in **51.25% of 1,600 simulated weeks**. A 30% scope cut to the essay raises that fraction to **93.5%**. These are reproducible simulation results conditional on authored inputs and a scheduling policy, not measured student outcomes, calibrated forecasts or AI inference.

[Open Daylight](https://toukoursin.github.io/daylight/) · [Source](https://github.com/ToukoUrsin/daylight)

## Run

Requires Node.js 22+; no npm dependencies or API keys.

```sh
npm start
# http://127.0.0.1:4328
npm test
npm run build
```

The production files are in `dist/`. Serve that directory with any static web host. The local server binds to loopback only. The public demo uses GitHub Pages. Plans are processed and stored locally in the browser; there is no application backend, account or calendar connection. GitHub receives ordinary page requests when it serves the site.

## A usable week

1. Start from the clearly synthetic example or edit tasks. Each task has best/likely/worst hours, an earliest start day, an end-of-day deadline, and tasks that must finish first.
2. Set hours you can actually spend on this work each day. Class, meals and rest belong outside this budget.
3. Compare one change. Both simulations reuse task-specific random draws so differences arise from the changed assumption and its downstream schedule effects.
4. Inspect per-task probabilities and the likely-duration example schedule. The current/changed switch changes the schedule, not its assumptions.
5. Apply the change, undo it, or export a replay. Import recomputes every result from the plan, intervention, seed and engine version; it never trusts supplied result fields.

The editor rejects dependency cycles, missing prerequisites, inverted hour estimates, invalid dates, impossible dependency release timing, and malformed or oversized imports. A task that is still a prerequisite cannot be deleted until those references are removed. Local browser storage is optional; export remains available if storage is blocked.

## Model and limitations

- **Distribution:** independent triangular durations from optimistic / most likely / pessimistic estimates. Equal bounds produce a fixed duration.
- **Scheduling:** a single student's preemptible work. Daily capacity is consumed chronologically, and tasks only become ready once released and after every dependency finishes. Ready tasks are ordered by the earliest deadline among themselves and downstream dependents, then own deadline and deterministic ID order. Dependencies can hand off within a day. Unused time is not moved backwards.
- **Success:** completion by the end of the declared deadline day. Unfinished tasks count as failures. The headline requires every task to succeed in that simulated week.
- **Comparison:** deterministic common random numbers keyed by seed, iteration and task ID. A scope cut scales all three duration estimates. An earlier start only changes release, never dependencies. An extra work block only changes daily capacity.
- **Uncertainty:** the displayed 95% Wilson interval describes finite simulation sampling only. It does not capture wrong duration estimates or missing real-world factors.
- **Limits:** no fatigue, interruptions, shared bad days, task-switching cost or changing priorities. Independence can understate correlated risk. The heuristic does not prove optimality. Best-duration misses are labeled as misses under this policy, not a proof that no schedule exists. A proportional scope cut may not preserve quality in reality.
- **Time:** days are abstract work budgets, not appointments. The displayed fractional completion coordinate is progress through that day's available hours, not a wall-clock time.

## Architecture

`engine.mjs` validates, schedules, samples and compares without DOM access. `app.mjs` owns the accessible native controls, task/capacity dialogs, visualization, local persistence and replay workflow. `style.css` contains responsive/reduced-motion rules. `server.mjs` is a small local static server with a network-blocking content policy. `build.mjs` produces a dependency-free static site. `tests/engine.test.mjs` checks algorithmic invariants, boundary conditions and untrusted imports.

Replay schema: `{format:"daylight-replay",version:1,engine:"1.0.0",plan:{version:1,title,startDate,days,seed,iterations,capacity,tasks},change}`. Each task includes `id,title,optimistic,likely,pessimistic,deadline,release,dependencies,color`. Supported changes are `scope(taskId,percent)`, `capacity(day,hours)` or `earlier(taskId,days)`. Bounds: 3–14 days, 1–12 tasks, 100–5,000 simulations, 0–16 available hours/day. The built-in editor shows a seven-day example; imported plans can span up to fourteen days.

## Provenance and entry

Original project created September 21, 2026 Pacific, during the InfinityX 2K26 build period. All source, layout, SVG icon and synthetic tasks were created for this entry with substantial OpenAI Codex assistance directed by Touko Ursin. Claude (Anthropic) assisted with browser QA, layout fixes and the demo film, which uses an ElevenLabs stock synthetic voice. No source from other campaign entries, private calendars, student records, third-party images, fonts or external APIs is used. Runtime has no AI inference. MIT licensed; system fonts. See [rules](docs/rules.md), [demo plan](docs/demo-plan.md), [validation](docs/validation.md) and [credits](CREDITS.md).

Desktop and phone-width layout, keyboard dialogs, labels and replay round-trips are checked in Chromium; see [validation](docs/validation.md). A [demo film](media/daylight-demo.mp4) and screenshots of the actual app are in `media/`. This project has not yet been submitted.
