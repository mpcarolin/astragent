# Stretch goal — agentic UI control with Claude

Research date: 2026-09-18. **Status: stretch goal, final phase.** Nothing here should be
built until the basic UI works. Companion to `2026-09-18-local-nl-camera-control.md`, which
covers the small/local-model tiers this supersedes.

Goal: ask any question, and the agent drives the camera, drives the UI, and answers in prose
rendered as native UI — not a chat bubble.

---

## 1. Why a real model changes the design

The local-model research constrained the model to *extraction* — emit a `SceneRequest`, let
deterministic code do everything else. That constraint existed because a 230M model cannot
be trusted to chain steps or decide when it lacks data.

A frontier model removes the constraint, and the architecture shifts accordingly:

| | Local small model | Claude |
|---|---|---|
| Role | Extract one struct | Orchestrate a multi-step loop |
| Turns | Single shot | Iterative — query, inspect, refine, answer |
| Unknown answers | Guesses | Can call a tool, read the result, and say "no object matches" |
| Compound queries | Degrades past ~2 clauses | Handles naturally |
| Output | A struct | A struct *and* grounded prose *and* UI directives |

The important gain is not prose quality. It is that **Claude can look things up before
answering.** "Which asteroid comes closest to Earth?" becomes: call `queryCloseApproaches`,
read the real rows, pick the top one, call `focusObject`, then narrate from the actual
numbers. No hallucinated designations, because the model never had to recall one.

---

## 2. The tool surface

The tools are the API. Everything from the earlier research becomes a tool, and the schemas
are already designed.

```typescript
// Read — the model gathers facts
queryObjects({ filter, sortBy, limit })        // over the 42k local dataset
queryCloseApproaches({ body, maxDistance, dateRange, sortBy, limit })
getObjectDetails({ designation })              // elements, H, diameter, class, condition_code
propagate({ designation, time })               // the stateless simulator — exact positions

// Write — the model drives the UI
focusObject({ designation, composition, distance })
setTime({ time })  |  animateTime({ from, to, speed })
showOrbit({ designation, on })
annotate({ designation, fields })              // native annotation card, not prose
highlight({ designations, reason })
```

Two rules that matter more than the schemas:

1. **Read tools return data, never rendered text.** The model narrates; the tools do not.
2. **`propagate` is the same pure function the renderer calls.** One source of truth for
   position. The model cannot compute a position that disagrees with what is drawn.

### Why the stateless simulator pays off here

`propagate(elements, jd)` is an unusually clean tool: pure, cheap, deterministic, no side
effects, safe to call repeatedly. The functional design chosen for rendering reasons turns
out to be exactly the right shape for a tool surface. Nothing needs to be rebuilt.

---

## 3. Implementation notes

Verified against the bundled `claude-api` skill on 2026-09-18 — several of these differ from
what older tutorials and training priors suggest.

**Model.** `claude-opus-5`. (The request named "claude-sonnet" — `claude-sonnet-5` is the
current Sonnet ID and is a reasonable cost-driven choice, but Opus 5 is the skill's default
and the better starting point; measure before downgrading.)

**Thinking.** `thinking: { type: "adaptive" }`. **`budget_tokens` is removed and returns a
400** on Opus 5 / Sonnet 5 — a common stale pattern. Pair with
`output_config: { effort: "..." }` (`low` → `max`, default `high`).

**The agent loop.** Use the SDK's tool runner rather than hand-writing
`while (stop_reason === "tool_use")`:

```typescript
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
const runner = client.beta.messages.toolRunner({ ... });
await runner;
```

Per-turn hooks give approval gates and logging without owning the loop. This is the API
SDK's Tool Runner — *not* the Claude Agent SDK, which is a separate product (Claude Code as
a library) and the wrong tool here.

**Structured output.** `output_config: { format: {...} }`. The older `output_format`
parameter is deprecated. For tools, `strict: true` goes on the *tool definition*, alongside
`name`/`description`/`input_schema` — not on `tool_choice` — and the schema needs
`additionalProperties: false` plus `required`.

**Streaming.** Stream for anything with long output. With client-side tools, set
`eager_input_streaming: true` per tool so large inputs stream as generated — but then the
client owns validation: parse with `JSON.parse` inside a guard and validate against the
schema before executing, because a truncated input can arrive silently. Check `stop_reason`
for `max_tokens` / `refusal` before running any tool call.

**Parallel tool use.** Claude may emit several `tool_use` blocks in one message. Execute
concurrently and return **all** `tool_result` blocks in a **single** user message —
splitting them across messages silently trains the model out of parallel calls. Return
failures as `tool_result` with `is_error: true`; never drop one.

**Caching.** The 42k-object catalogue summary and the tool definitions are a stable prefix —
cache them. Order is `tools` → `system` → `messages`, so keep volatile content (current
camera state, timestamp) *after* the last `cache_control` breakpoint. Verify with
`usage.cache_read_input_tokens`; if it stays zero, something in the prefix is varying.

**Errors.** Catch most-specific-first: `NotFoundError` → `RateLimitError` → `APIStatusError`
→ `APIConnectionError`. A single broad catch loses the retryable/non-retryable distinction.

---

## 4. Native UI, not a chat log

The brief is "answers using text with native UI." The model should emit *typed directives*
that the app renders, rather than markdown to dump in a panel.

```typescript
type AgentResponse = {
  prose: string                    // grounded narration — short
  annotations: Annotation[]        // rendered as cards anchored to objects
  actions: UIAction[]              // camera, time, overlays — already applied via tools
  citations: { field: string, value: string, source: "SBDB" | "CAD" }[]
}
```

Every number in `prose` should also exist in `annotations` or `citations`. That pairing is
what makes the prose auditable — if a figure appears in narration but in no annotation, it
was invented. Enforce this in code, not by prompting.

The write tools already fire during the loop, so the camera moves *while* the model is still
thinking. The prose arrives last. That ordering is good UX: motion first, explanation after.

---

## 5. The architectural cost

This tier **requires a backend.** An API key cannot ship in a browser bundle. That breaks
the serverless property every earlier decision protected, so it should stay opt-in:

- Tier 0 (parser) and Tier 1 (Chrome Prompt API) remain the default path — zero cost, zero
  infra, works offline.
- The Claude tier is a *feature flag*, not the front door.

Minimum viable backend: one endpoint that proxies the tool-runner loop, holds the key, and
streams events back over SSE. The read tools can execute server-side against a copy of the
dataset; the write tools return directives the client applies.

Rate limiting and an auth story are required before this is public — an unauthenticated
proxy to a paid API is an open invoice.

---

## 6. Guardrails

**Never let the model assert impact risk.** Route those questions to Sentry's published
data. A plausible fabricated probability is the single worst failure mode this app could
have. Encode it in the system prompt *and* enforce it by not exposing a tool that could be
misread as a risk estimate.

**Ground every figure in a tool result.** The system prompt should state that unretrieved
numbers must not appear in prose. The citation pairing in §4 makes violations detectable.

**Surface data provenance.** CAD data is baked at build time; elements carry an epoch. When
the model says "comes closest," the UI should show the epoch and build date. Real limits,
honestly displayed.

**Expose `condition_code`.** Poorly-observed objects have genuinely uncertain orbits. Let
the model see the uncertainty field so it can qualify rather than overstate.

---

## 7. Sequencing

1. Basic UI working — renderer, simulator, dataset. *(prerequisite)*
2. Tier 0 parser + fixture corpus. Defines "working" for every later tier.
3. Tier 1 Chrome Prompt API against the same `SceneRequest` boundary.
4. Read-only tools + backend proxy. Claude answers questions; UI unchanged. Lowest-risk
   first slice — no write path, so nothing can move unexpectedly.
5. Write tools. Camera and overlays under model control.
6. Native UI directives and the citation-pairing enforcement.

Step 4 is the natural first real milestone: it proves the tool surface and the grounding
discipline before handing over any UI control.

---

## 8. Open questions

- **Latency.** A multi-tool loop may take several seconds. The write-tools-fire-early
  ordering hides some of it, but "which asteroid comes closest" doing four round trips needs
  measurement.
- **Cost per query.** Unmeasured. A cached catalogue prefix plus a short loop should be
  cheap, but the fixture corpus from Tier 0 doubles as a cost benchmark — run it and count.
- **Effort tuning.** `high` is the default; `low` may well suffice for single-lookup
  questions. Worth a sweep once the corpus exists.
- **How much catalogue context to include.** 42k objects will not fit in a prompt. Likely a
  summary plus `queryObjects` for the rest — but the split needs testing.

---

## Sources

Primary source for all API specifics: the bundled `claude-api` skill (read 2026-09-18),
which supersedes training-era patterns. Key corrections it supplied: `budget_tokens` removal
(400 on Opus 5 / Sonnet 5), `output_config.format` replacing `output_format`, `strict` on the
tool definition rather than `tool_choice`, Tool Runner vs. Claude Agent SDK distinction, and
the single-user-message rule for parallel tool results.
