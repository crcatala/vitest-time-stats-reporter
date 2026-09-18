# Research: Jev and its potential for `vitest-time-stats-reporter`

**Repository:** `crcatala/vitest-time-stats-reporter` (v0.4.0, MIT) — an additive Vitest reporter showing test execution-time distribution (histogram, percentiles, slow-test concentration).
**Research date:** 2026-09-18
**Requested output path:** `/tmp/jev-research.1FrXpC/vitest-time-stats-reporter/docs/research/jev-opportunity.md`
**Actually written path (runtime-authoritative):** `/home/mog/.pi/agent/sessions/--home-mog-workspace-research-learning-agent--/subagent-artifacts/outputs/7f91789e-a5cd-4027-a702-9423f2131604/vitest-time-stats-reporter.md` *(the parent agent will place it at the requested repo path when publishing)*

---

## Method & evidence disclosure

- **Web research was executed by the parent agent.** This research subagent had no `web_search` or `source_check` tool available; the parent supplied a source dossier (`/tmp/jev-research.1FrXpC/jev-source-dossier.md`) containing findings fetched directly from the requested TypeSafe, evals, and Archer Hume sources plus TypeSafe docs. All Jev claims below are sourced to that dossier and attributed as **vendor claim**, **independent evidence**, or **researcher inference**.
- **Repository inspection was performed directly** with the `read` tool on `/tmp/jev-research.1FrXpC/vitest-time-stats-reporter` (`package.json`, `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `src/reporter.ts`, `src/timing-stats.ts`, `vitest.demo.config.ts`, `scripts/check-package.mjs`, `test/timing-stats.test.ts`).
- **Limitations:** no independent reproduction of Jev's benchmarks, pricing, or calibration was possible here. Treat vendor performance/cost numbers as workload-specific marketing claims.

---

## 1. Executive summary

Jev is the first public **"System One Model"** from TypeSafe: a fast, structured-decision model that takes a text state and a map of typed questions and returns **typed decisions with probabilities** (yes/no, choice, or rubric score), not generated prose ([typesafe.ai](https://typesafe.ai), [launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [System One docs](https://docs.typesafe.ai/concepts/system-one)). It is explicitly *not* a generative or agentic model — code owns workflow and side effects.

For this repository, the honest bottom line is that **Jev is a poor fit for the reporter's core rendering/statistics logic** (which is deterministic, offline, zero-network pure functions) and a **genuinely useful fit adjacent to it**: the reporter already ships a versioned, machine-readable JSON artifact explicitly marketed "for CI or agent-based analysis" (`output: 'json'`, `schemaVersion: 1`). That JSON is a ready-made structured *state* input for a Jev-powered **decision/triage layer** that classifies whether a timing change is meaningful, which subsystem is implicated, and whether CI should block — with code generated prose/actions. **Bottom-line potential: High upside as an optional companion capability consumed downstream of the JSON contract, with modest upside if embedded directly in the reporter.**

---

## 2. Technical explanation of Jev and its capabilities

### 2.1 What it is
- **Vendor claim (high confidence, consistent across TypeSafe's own pages):** Jev is the flagship System One Model — built for "fast, structured decisions that software can use directly," with an interface of structured state in and typed decisions/probabilities out rather than free-form text (typesafe.ai; launch post).
- **Vendor claim:** The API is `POST https://api.typesafe.ai/v1/systemone` with a bearer API key; the documented model alias is `jev-latest`; one request evaluates one `state` (string, JSON object, or array of text values) against a map of typed questions (TypeSafe API docs).
- **Vendor claim:** Three question primitives:
  - **Noul** — yes/no question → probability (0–1) for "yes".
  - **Choice** — select among caller-defined options → selected option + full probability distribution.
  - **Score** — rate against an ordered caller-defined rubric → probability-weighted score, legend, distribution, and derived confidence.
- **Vendor claim:** Choice and Score responses include full distributions and a derived `confidence`; Noul returns a probability but not that same confidence field. TypeSafe states confidence is *derived from the distribution*, not an independent learned guarantee (docs/confidence).

### 2.2 What it explicitly does **not** do
- **Vendor claim:** System One does not generate replies, code, or explanations of reasoning; it is not an autonomous agent — code owns control flow and side effects (System One docs, "how to build with System One").
- **Vendor claim:** Input is text-only; images/audio/video are documented as unsupported.
- **Vendor claim:** Questions can be evaluated independently and in parallel in one request; the recommended pattern is narrow atomic questions, deterministic control flow, and probability thresholds to act/review/escalate.

### 2.3 Training direction and calibration
- **Vendor claim:** "RLCD" (Reinforcement Learning for Calibrated Decisions) trains so that higher probabilities correspond to higher empirical accuracy **across groups** — not a per-prediction guarantee.
- **Independent evidence:** Archer Hume's post reports black-box observations consistent with question isolation, option-order sensitivity, listwise option interactions, and fast server-reported timings, and includes a calibration analysis on selected benchmark/fresh-math samples ([archerhume.com](https://archerhume.com/posts/jevs-architecture-unmasked), [evidence.json](https://archerhume.com/research/jev/evidence.json)). The author repeatedly labels deeper architecture claims (causal transformer, sparse MoE, KV sharing, exact readout) as **speculative/black-box inference**.

### 2.4 Performance, cost, access
- **Vendor claim (launch post):** ~70–500 ms end-to-end for TypeSafe workflows; input price **$0.042 per million tokens ($42/billion)**; free output tokens; ~40x–200x speedups for System One-shaped queries; homepage comparisons claim 193.6x faster / 444.6x cheaper. These are **workload-specific vendor numbers, not independent guarantees**.
- **Vendor claim (launch post):** Jev was in **early access** at launch; published workflow evals compare models on the same code-defined workflow using expensive external-model predictions as reference probabilities. Disclosed biases: workflows authored by the model-capabilities team, reference used OpenAI/Anthropic models, and measurement depends on laptop/service-region conditions.
- **Vendor claim:** "Type-safe outputs cannot produce type errors under the output contract" — this is a **schema** guarantee, not semantic correctness or calibrated accuracy. A valid typed decision can still be wrong.
- **Vendor claim (API docs):** Errors 401, 422, 429, 529; exponential backoff recommended for rate limiting/overload.

### 2.5 Evals
- **Vendor-controlled evidence:** `evals.typesafe.ai` presents code-defined workflows where the model answers narrow questions and code decides the action (visible example: expense-claim review — classify expense type, assess description match, then route to manager review or approval). Treat as vendor evidence; methodology should be inspected before treating scores as an external benchmark.
- **Independent inference:** Archer Hume's reconstruction suggests the core proposition is *direct decision probabilities over shared state and allowed answers* rather than generated confidence text.

### 2.6 Engineering fit summary
- **Best fit** (supported by sources): narrow semantic classification, detection, routing, scoring, ranking/retrieval, verification, feature extraction where the answer space is definable in advance and code acts on results.
- **Poor fit / unsupported:** open-ended generation, code generation, explanations, unconstrained agent loops, multimodal input.
- **Safe integration pattern:** deterministic prechecks → minimal relevant structured state → independent atomic questions → reviewable thresholds → log probabilities and outcomes → route low-confidence/high-risk cases to humans or a stronger model → never let a valid schema response bypass authorization/policy/side-effect checks (documented guidance).
- **Researcher inference:** For any deterministic task (e.g., percentile math), calling a remote model adds cost, latency, and a failure mode for zero accuracy benefit. Jev's value appears only where the decision depends on **unstructured text** (names, logs, PR descriptions, commit messages) that regex/heuristics handle poorly.

---

## 3. Repo-specific opportunities

### 3.1 What the repository is today (direct inspection)
- **Thin, additive reporter** implementing Vitest's `Reporter`; hooks `onTestRunEnd`, collects each test's `fullName`, relativeized `file`, and `diagnostic().duration` (`src/reporter.ts`).
- **Pure, runner-agnostic aggregation** in `src/timing-stats.ts`: `createTimingStats` produces histogram bins, p50/p90/p99/max, mean/min/total, slow-test count/percentage, slow-test share of execution time, and a ranked slowest list. `formatTimingStats` renders aligned, ANSI-colored terminal output.
- **Two output modes:** colored terminal text, or **versioned JSON** (`schemaVersion: 1`, `kind: "vitest-time-stats"`) to stdout/file, explicitly described as "for CI or agent-based analysis."
- **Design posture:** additive (composes with `default`/`json`/JUnit), minimal deps (`picocolors` only), **zero network I/O**, deterministic pure functions with a dedicated unit test suite, Node `^22.21.0 || >=24`, MIT, personally maintained (CONTRIBUTING: no PRs accepted, bug reports with repro welcome).

### 3.2 The natural integration seam
**Researcher inference:** the JSON output (`schemaVersion: 1`) is the single clean contract point. Jev accepts a JSON object as `state`, so a downstream tool can pass the stats JSON (plus optional unstructured context) directly as structured state. This preserves the reporter's offline/zero-network guarantee while enabling a Jev-powered decision layer.

### 3.3 Opportunity catalog

**A. New customer-facing feature — "timing-regression verdict" companion.**
Feed previous-run and current-run stats JSON plus unstructured context (commit messages, PR description, dependency-bump notes, changed file list) into Jev to answer narrow questions: *Is this a meaningful regression vs. run-to-run noise? Which subsystem/area is implicated? Should CI block (yes/no probability)?* Code generates the actual human-readable PR comment; Jev only supplies the decision, severity band, and probabilities. This is a genuine capability the reporter cannot express with pure math alone, because the "is it meaningful?" judgment often hinges on *why* the code changed.

**B. Backend/automation — confidence-gated CI routing.**
Use Noul/Choice probability thresholds to route: below threshold → pass silently; mid-band → post an advisory comment; above threshold → fail/require review. Keeps thresholds reviewable and logs probabilities for offline calibration, matching TypeSafe's documented build pattern.

**C. Developer tooling — flake vs. real-slow classification.**
Combine timing deltas with failure text and retry history; ask Choice (real bug / flaky / environment/timeout / noise) and route low-confidence to humans. Directly targets the maintainer workflow of "is this test slow for a real reason?"

**D. Admin/operations — long-term drift triage.**
A stats store across runs (the repo has none today) plus Jev to classify drift events as noise vs. regression using release notes/dependency changes as state. Requires infrastructure the repo lacks — this is a new subsystem, not a reporter tweak.

**E. Positioning — "agent-native CI" story.**
The README already frames JSON output for agent analysis. Positioning the reporter as the observability/state-provider layer for **agent-run test suites** (where Jev verifies model/tool outputs and gates routing) is a coherent narrative, but it is **speculative and marketing-adjacent** until a concrete integration ships.

**F. Repo's *own* workflow — low value.**
Jev could triage incoming bug reports (does it include repro/platform/Node version?). But CONTRIBUTING states PRs and feature requests are not accepted and the project is personally maintained, implying low issue volume — low leverage.

### 3.4 Architectural disruption of embedding Jev in the core reporter (important)
**Researcher inference backed by inspection:** adding a network model call into `src/reporter.ts` would break three deliberate properties — offline CI, zero network dependencies, and deterministic output — and would require API-key handling in the reporter process (a secrets/security concern) and per-run cost. **Recommendation: do NOT embed Jev in the reporter.** Build an optional **companion** (`time-stats-triage`-style tool/package) or an out-of-tree integration that consumes the versioned JSON. This keeps `vitest-time-stats-reporter` a pure, offline reporter and makes the Jev layer strictly opt-in.

---

## 4. Recommendations by predicted impact

> Categories are specified as exactly **Huge / Medium / Low**. Impact labels are my assessment (researcher inference) grounded in the inspected repo and the source dossier; they are not vendor statements.

### HUGE
**H1. Optional Jev-powered "timing-regression verdict" companion consuming the `schemaVersion: 1` JSON.**
- **Expected value:** Turns a passive visualization into an actionable, agent-consumable decision surface; enables PR-comment automation and confidence-gated CI gating. Highest leverage because it reuses an existing, versioned contract and adds capability the repo cannot express mathematically.
- **Implementation complexity:** Medium (new HTTP client, auth/key config, threshold config, calibration harness, prompt/question design for Noul/Choice questions).
- **Architectural disruption:** Low if built as a separate companion package; High if embedded in the reporter (avoid).
- **Dependencies:** TypeSafe API key + network in the *companion* (neither required by the core reporter); Node ≥22; a place to store prior-run JSON for comparison.
- **Risks:** Vendor early-access volatility (`jev-latest` alias, 429/529); calibration must be validated per-domain with held-out data; cost per CI run; must not let a valid typed answer bypass deterministic gates; **no independent benchmark of this specific use case exists**.
- **Next experiment:** Offline prototype (no repo code changes): take two `output: 'json'` artifacts from consecutive runs and one commit-message blob, call `POST /v1/systemone` with a Noul question ("is this a meaningful regression versus run-to-run noise?") plus a Choice question ("which area is implicated?"), and measure agreement against a maintainer's hand labels over ~30 historical run pairs. Success bar: stable probabilities correlating with human verdicts, and cost/latency acceptable per CI run.

### MEDIUM
**M1. Confidence-gated CI routing automation (PR annotation + optional block).**
- **Expected value:** Removes manual histogram reading from review; routes only ambiguous/risky changes to humans. High-volume, low-latency — a strong Jev shape.
- **Complexity:** Medium. **Disruption:** Low (out-of-tree). **Dependencies:** H1's verdict contract; GitHub Actions plumbing.
- **Risks:** False "block" verdicts erode trust; requires reviewable thresholds and a manual override path. **Next experiment:** Wire H1's verdict into a *non-blocking* PR comment on a fork and collect false-positive/negative rates before enabling any gate.

**M2. Flake-vs-real-slow classification using failure text + timing deltas.**
- **Expected value:** Attacks the maintainer's real triage question; Jev's semantic classification over unstructured failure text is a documented best fit.
- **Complexity:** Medium. **Disruption:** Low. **Dependencies:** access to failure/retry text (beyond the reporter's current per-test duration data) — likely a separate collector.
- **Risks:** Needs labeled flake data to calibrate; overlapping heuristics may already suffice. **Next experiment:** Label 50 known flaky vs. real-slow cases and compare Jev Choice accuracy against a simple retry-based heuristic baseline.

**M3. Positioning the reporter as the state-provider for agent-native CI.**
- **Expected value:** Differentiation and narrative, plus a documented integration example. **Complexity:** Low–Medium (docs/sample). **Disruption:** None to core.
- **Risks:** Marketing without a shipped reference integration is hollow; keep claims factual and labeled. **Next experiment:** Publish a minimal example repo/README section showing the JSON artifact feeding a Jev verdict call.

### LOW
**L1. Using Jev for the reporter's own statistics/rendering.** Deterministic pure math beats a remote model on cost, latency, determinism, and correctness — **do not pursue.**
**L2. Jev-triaging the repo's own issues/PRs.** CONTRIBUTING signals low contribution/issue volume and a no-PR posture; little leverage.
**L3. Long-term drift triage store + Jev classification.** Conceptually valid (M-grade eventually) but requires a stats backend the repo does not have; **too much new infrastructure for the current scope.**
**L4. "Semantic linting" of test names / generated narratives.** Jev cannot generate prose, and naming-quality decisions offer thin value here.

---

## 5. Prioritized roadmap, open questions, limitations

### Roadmap
1. **Now (no code changes to the repo):** Stand up H1 as an offline prototype. Reuse existing `output: 'json'` artifacts; build a labeled dataset of ~30 consecutive run pairs; measure Jev agreement, latency, and cost. *(Gates everything else.)*
2. **Next (opt-in, out-of-tree):** Ship M1 as a non-blocking PR-comment bot behind a feature flag; log probabilities to measure calibration drift over time.
3. **Then (if data supports):** Add M2 using failure/retry text to separate flake from real-slow; only enable any hard CI gate after false-positive rates are acceptable.
4. **Communicate (M3):** Document the JSON→Jev integration pattern without over-claiming.
5. **Explicitly avoid:** L1 (embedding Jev in the reporter) and any design that puts an API key or network dependency inside the reporter process.

### Open questions
- Does the verdict use case actually beat a deterministic threshold baseline (e.g., "p90 up > X% AND slowed tests overlap changed files")? If not, Jev adds cost without value. **Unresolved — requires the H1 experiment.**
- What is the real per-CI-run cost and 429/529 exposure at the alias `jev-latest`, and how does early-access version skew affect stability? **Unverified; vendor early-access only.**
- Does the JSON `state` alone give enough signal, or is unstructured context (commit messages, logs) required for the verdict to be useful? **Researcher inference: context is likely required for the "meaningful regression" judgment.**
- Privacy: test names and file paths can encode internal project/domain names being sent to a third-party API. **Unverified data-handling terms for TypeSafe's API were not available to this research; treat as an open privacy question and default to opt-in + minimal state.**

### Limitations of this research
- **No independent verification** of Jev's benchmarks, pricing, latency, or calibration was possible in this run; the parent fetched the sources and this subagent reasoned from that dossier plus direct repository inspection.
- **No web or source-check tools** were available to this subagent, so no `source_check`-style validation was performed on the dossier's quotes.
- Performance/cost claims are **vendor-reported and workload-specific**; the launch post itself discloses authoring and measurement bias.
- The repo's Jev opportunities are **researcher inference**; none has been prototyped, so all impact ratings are predictions, not measured outcomes.

---

## 6. Sources (titles, URLs, research date 2026-09-18)

- TypeSafe — *System One Models / Jev overview* — https://typesafe.ai
- TypeSafe Blog — *Introducing System One Models and Jev* (vendor claims: latency, pricing, speedups, early access, disclosed biases) — https://typesafe.ai/blog/introducing-system-one-models-and-jev
- TypeSafe Docs — *System One concepts* (text-only input; no generation/agent; parallel atomic questions) — https://docs.typesafe.ai/concepts/system-one
- TypeSafe Docs — *API reference* (`POST /v1/systemone`, `jev-latest`, error codes, backoff) — https://docs.typesafe.ai/api
- TypeSafe Docs — *How to build with System One* (deterministic control flow, thresholds, escalation) — https://docs.typesafe.ai/concepts/how-to-build-with-system-one
- TypeSafe Docs — *Confidence* (derived from distribution, not a guarantee) — https://docs.typesafe.ai/confidence
- TypeSafe Docs — *Machine learning primer* — https://docs.typesafe.ai/introduction/machine-learning-primer
- TypeSafe Evals — *code-defined workflow evaluations* (vendor-controlled evidence) — https://evals.typesafe.ai
- Archer Hume — *Jev's Architecture Unmasked* (independent, black-box; labels architecture claims speculative) — https://archerhume.com/posts/jevs-architecture-unmasked
- Archer Hume — *Jev evidence bundle* (calibration analysis on selected samples) — https://archerhume.com/research/jev/evidence.json
- Repository files inspected directly: `package.json`, `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `src/reporter.ts`, `src/timing-stats.ts`, `vitest.demo.config.ts`, `scripts/check-package.mjs`, `test/timing-stats.test.ts` at `/tmp/jev-research.1FrXpC/vitest-time-stats-reporter`.

**Deprioritized/rejected:** none were reviewed directly by this subagent (no web tooling); the source set above was curated by the parent. Any SEO-style secondary coverage of Jev was not used as evidence.
