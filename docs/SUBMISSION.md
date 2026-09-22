# Daylight — InfinityX submission copy

Prepared for InfinityX Global Hackathon 2K26. This is copy for the organizer form, not a submission receipt.

## Project name

Daylight

## Tagline

A plan is a guess. Give it some daylight: simulate your student workload, then find the one change that gives your week room to breathe.

## Links

- Working demo: https://toukoursin.github.io/daylight/
- Public source: https://github.com/ToukoUrsin/daylight
- Technical explanation and run instructions: https://github.com/ToukoUrsin/daylight#readme
- License: MIT
- Demo video: not yet recorded or hosted. Do not submit a placeholder.
- Screenshots: capture the actual app after supported-browser review. None are claimed complete.

## Inspiration

Seventeen hours available. Thirteen and a half hours of work. A normal planner makes that look comfortable.

But reading has to finish before the outline. The outline comes before the essay. Revision must still happen before Friday. A spare hour on Sunday cannot rescue a missed Friday deadline.

Daylight starts with that ordinary student problem: a to-do list knows what is due, but rarely helps us understand which assumptions make a week fragile. The aim is to make a manageable decision before the deadline becomes an emergency.

## What it does

Daylight turns a workload into an inspectable simulation. You enter tasks, their prerequisites, earliest start days and deadlines. Instead of pretending every task has one exact duration, you give it a best, likely and worst estimate. You also decide how many hours are actually available each day.

The app plays out possible weeks and reports how often each task — and the whole plan — meets its deadline. Then you change one thing: narrow a task's scope, make it available earlier, or add a work block. Both versions use the same random duration draws, so the comparison isolates the changed assumption and its downstream effects within the model.

In the authored synthetic example, 51.25% of 1,600 simulated weeks meet every deadline. Reducing the essay's three duration estimates by 30% raises that fraction to 93.5%. The user can inspect the schedule, accept the change, undo it, or edit the assumptions. Those numbers are reproducible simulation outputs, not measured academic outcomes or guarantees.

A replay export carries the plan, comparison, random seed and engine version. Import recomputes the results instead of trusting a saved headline. The app needs no account, calendar permission or external AI service.

## How we built it

The project is an original JavaScript, HTML and CSS implementation created during the InfinityX build period. It has no third-party runtime packages. A pure simulation engine is separated from the interface, so its behavior can be checked independently.

For every simulated week, the engine samples independent triangular task durations. A single-student scheduler works through the available daily hours, honors release dates, and only starts tasks after all prerequisites finish. It prioritizes the most urgent downstream deadline. Work can continue across days and dependencies can hand off within a day.

The engine uses deterministic random values keyed by seed, iteration and task ID. This keeps unchanged task-duration samples identical across a comparison. The interface exposes the assumptions, individual deadline probabilities, likely-duration schedule and a sampling interval rather than presenting the result as unexplained certainty.

The static site is hosted on GitHub Pages. Plans stay in browser storage or user-exported JSON files. GitHub receives ordinary requests to serve the page; the application sends no task data to a backend.

## Challenges we ran into

The difficult part was defining what a fair comparison means. If the two plans get unrelated lucky and unlucky samples, an apparent improvement can partly be simulation noise. Reusing the same underlying draws makes the intervention much easier to inspect.

Another challenge was treating dependencies and deadlines precisely. Completing one task halfway through a day should allow its successor to use the remaining hours, while a task that is not yet available must wait. Tests cover those boundaries, exact end-of-day completion, capacity limits and malformed dependency graphs.

We also kept the limits visible. The schedule is a heuristic, not an optimality proof. Independent duration estimates leave out shared bad days and fatigue. A scope reduction assumes proportional time savings; the student must decide whether the quality tradeoff is acceptable. The displayed confidence interval describes simulation sampling, not the accuracy of those assumptions.

## Accomplishments that we're proud of

- A complete editable planning and comparison workflow, with local saving, apply/undo and portable replay files.
- A concrete result a judge can reproduce: 13.5 likely work hours inside 17 available hours can still leave a fragile deadline chain.
- Thirteen meaningful engine tests covering determinism, shared samples, timing boundaries, no overbooking, dependency order, input safety and replay integrity.
- A dependency-free static app with original layout, SVG icon, system fonts, native form controls and explicit model disclosures.
- Honest uncertainty: no fake AI inference, invented calendar connection, claimed student study or guarantee.

## What we learned

Weekly totals can conceal the real bottleneck: when work becomes possible and which later tasks depend on it. A planner becomes more useful when it helps explain that structure.

We also learned to separate two kinds of uncertainty. Increasing the number of simulated weeks can reduce Monte Carlo sampling noise. It cannot fix optimistic estimates or an incomplete model of real life. Daylight makes that distinction visible rather than promising that a larger percentage means certainty.

## What's next for Daylight

The next step is supported-browser visual, mobile and keyboard review, followed by feedback from students using their own plans. That feedback should test whether the explanations and available-hour inputs are understandable before adding more complexity.

Future model work could let a user include shared disruption days, compare several transparent scheduling policies, and distinguish optional scope from required work. Those capabilities are future work, not features of this entry.

## Built with

JavaScript; HTML; CSS; SVG; Node.js standard library; GitHub Pages; Monte Carlo simulation; triangular duration distributions; deterministic replay; localStorage.

## Team and AI disclosure

Entrant and product direction: Touko Ursin. Original project created September 21, 2026 Pacific for InfinityX Global Hackathon 2K26.

Substantial implementation, interface design, testing, documentation and submission-writing assistance was provided by OpenAI Codex under Touko's direction. All task examples and inputs are synthetic. No source from another campaign entry, private calendar, student record, downloaded artwork or external model API is used. Runtime behavior is deterministic simulation and ordinary application code, not AI inference. The original code and assets are MIT licensed.

## Current verification and completion state

Thirteen engine tests pass; the static build and local HTTP checks pass. Public asset verification is recorded in `docs/publication.json`. Browser visual, mobile, keyboard and full UI export/import checks remain pending because the supported integrated browser was unavailable. No video, screenshots or actual InfinityX submission is claimed complete.

## Suggested actual screenshot sequence

1. Default dashboard: visible synthetic example and 51% current / 94% changed values. Caption: “One assumption changes the simulated week; these are estimates, not guarantees.”
2. Essay task editor and dependency chain. Caption: “Best, likely and worst hours — with prerequisites and an end-of-day deadline.”
3. Current/changed schedule and open model disclosure. Caption: “Inspect the schedule, assumptions and limits. Export a replay to reproduce the result.”

Capture these from the real functioning app after review; do not use generated software screenshots.
