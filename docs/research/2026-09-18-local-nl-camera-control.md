# Natural-language camera control with local models

Research date: 2026-09-18. Companion to `2026-09-18-rendering-and-data-sources.md`.

Scope: how heavy in-browser models actually are, and what schema is needed to express
requests richer than object+time — camera angles ("with the sun in the background") and
compound scene requests ("show me Apophis's orbital trajectory").

---

## Correction to an earlier estimate

An earlier verbal estimate in conversation put in-browser models at "tens to hundreds of MB,
a strange ratio against a 73KB dataset." **That was wrong at the low end and omitted the
zero-download option entirely.** Corrected figures below.

---

## 1. What local inference actually costs

### 1.1 Size classes

| Option | Download | Notes |
|---|---|---|
| **Chrome Prompt API (Gemini Nano)** | **0 bytes of app payload** | Model is part of the browser, fetched once per *browser*, shared across all origins |
| LFM2.5 230M (WebLLM) | ~150 MB | Smallest practical WebLLM entry |
| LFM2.5 350M (WebLLM) | ~220 MB | |
| Gemma 4 E2B (WebLLM) | ~2.5 GB | Far beyond what this task needs |

The relevant band for structured extraction is the **150–220 MB** class, not the multi-GB
class. And Chrome's built-in path costs the app nothing — the ~4 GB Gemini Nano download is
borne by the browser, once, not per-site. The "strange ratio" objection dissolves.

### 1.2 Chrome Prompt API status

- Exposed as `LanguageModel` (the older `window.ai` surface has moved on).
- Present since Chrome 138 behind a flag, then origin trial; **structured output via JSON
  Schema is available in production Chrome**, not trial-gated.
- Full promotion out of origin trial expected **Chrome 150, end of 2026**.
- `LanguageModel.availability()` reports whether the model is ready; the model downloads
  separately on first use by an origin.
- `'LanguageModel' in self` is false on non-Chrome. Feature-detect and degrade.

### 1.3 Browser support reality

- WebGPU runtimes: Chrome 113+, Edge 113+, Safari 18+. **Firefox is not supported** by
  current WebLLM/Transformers.js WebGPU paths.
- Chrome Prompt API: Chrome only.

Neither path covers every browser. This confirms the layered design in §4 — the feature must
degrade to something that always works.

### 1.4 Constrained decoding is the decisive capability

More important than model size for this use case. Constrained decoding masks the next-token
distribution at each step so that only tokens keeping the output schema-valid can be
sampled. Invalid tokens get logit −∞ before sampling.

Consequence: **the output is guaranteed parseable.** No parse errors, no retries, no
fallback parser. This is what makes a 230M-parameter model viable — it cannot emit malformed
JSON even if it "wants" to, so the remaining question is only whether it picks the right
*values*, not whether the structure holds.

Available on both paths:
- Chrome Prompt API: `responseConstraint` field on `prompt()` / `promptStreaming()`, takes a
  JSON Schema.
- WebLLM: JSON-mode structured generation implemented in the WASM layer; OpenAI-compatible
  `response_format`. Function-calling is marked WIP — prefer plain JSON-schema output over
  relying on its tool-call API.

---

## 2. The schema

The key insight for the richer requests: **"with the sun in the background" is a geometry
problem, not a language problem.** The model's only job is to emit the token `sun-behind`.
Turning that into a camera position is deterministic code using positions the simulator
already provides. Same for trajectories — the model says `orbit-path`, and existing
`sampleOrbit()` does the work.

This keeps the model's burden tiny even as expressiveness grows.

```typescript
type SceneRequest = {
  // WHAT
  target: string            // raw text, fuzzy-matched locally — never trusted as canonical
  secondary?: string        // for relative framing: "Apophis and Earth"

  // WHEN
  time: { kind: "absolute", value: string }       // "2029", "2029-04-13"
      | { kind: "relative", value: string }       // "next decade", "now"
      | { kind: "event", value: "closest-approach" | "perihelion" | "aphelion" | "discovery" }
  range?: { from: string, to: string }            // for animated spans

  // HOW — framing
  composition?:
    | "sun-behind"          // target between camera and Sun
    | "sun-side"            // grazing light, high relief
    | "earth-behind"
    | "top-down"            // normal to ecliptic
    | "edge-on"             // in the ecliptic plane, shows inclination
    | "follow"              // camera rides the object
  distance?: "close" | "medium" | "wide" | "system"

  // WHAT TO DRAW
  show?: Array<"orbit-path" | "trajectory-trail" | "velocity-vector"
              | "close-approach-markers" | "neighbours" | "labels">

  // ANIMATION
  animate?: { from: string, to: string, speed?: "slow" | "medium" | "fast" }
}
```

Every field is a **closed enum except `target` and time strings**. Closed enums are where
small models are strongest and where constrained decoding is most effective — the grammar
can restrict sampling to exactly the six valid `composition` values.

### 2.1 Worked examples

| Utterance | Extracted |
|---|---|
| "show me Apophis in 2027 with the sun in the background" | `{target:"Apophis", time:{kind:"absolute",value:"2027"}, composition:"sun-behind"}` |
| "show me Apophis's orbital trajectory" | `{target:"Apophis", time:{kind:"relative",value:"now"}, show:["orbit-path"], distance:"system"}` |
| "watch Apophis pass Earth in 2029" | `{target:"Apophis", secondary:"Earth", time:{kind:"event",value:"closest-approach"}, animate:{from:"2029-04-10",to:"2029-04-16"}, show:["trajectory-trail"]}` |
| "look at the asteroid belt edge-on" | `{target:"belt", composition:"edge-on", distance:"system"}` |

---

## 3. Resolution pipeline

The model does **one** step of five. This is the architectural point.

```
utterance
   │
   ├─ 1. EXTRACT      ← the only model call; constrained to SceneRequest schema
   │
   ├─ 2. RESOLVE NAME    fuzzy-match `target` against the local 42k-object list
   │                     (authority = the dataset, never the model)
   │
   ├─ 3. RESOLVE TIME    "next decade" → JD range, against current date
   │                     "closest-approach" → look up in baked CAD data
   │
   ├─ 4. RESOLVE GEOMETRY  composition → camera vector, via simulator positions
   │
   └─ 5. APPLY          camera state + scene toggles → three.js
```

Steps 2–5 are pure functions, independently testable, and identical whichever model (or no
model) drives step 1.

### 3.1 Why name resolution must be local

Provisional designations — `1950 DA`, `2024 YR4`, `99942 Apophis` — tokenize badly and small
models will confidently emit plausible designations that do not exist. Do not ask the model
to know the catalogue. Have it emit the raw string, then fuzzy-match against the 42,446-name
list already in memory. This also absorbs typos, partial names, and phonetic spellings for
free.

### 3.2 Composition → camera, deterministically

`sun-behind` means: place the camera so the Sun is behind the target from the viewer's
perspective. The Sun is at the origin in heliocentric coordinates, so given target position
**p** at time *t*:

```
direction = normalize(p)        // origin → target, i.e. away from Sun
camera    = p + direction * d   // d from `distance` enum
lookAt    = p
```

`edge-on`: camera in the ecliptic plane, offset along the line of nodes.
`top-down`: camera at `p + (0,0,d)`, normal to the ecliptic.
`follow`: recompute per frame from the target's velocity vector.

No model involvement. Pure geometry over coordinates the simulator already returns — which
is exactly the payoff of the stateless simulator design.

---

## 4. Recommended layering

Ship in this order. Each tier is a strict superset of the previous one's capability, and the
`SceneRequest` boundary is identical for all of them — so the model choice is deferred, not
decided up front.

**Tier 0 — deterministic parser. No model, no download, every browser.**
A hand-written grammar over the schema plus fuzzy name matching handles the majority of
realistic phrasings ("show me X", "X in YEAR", "X orbit", "X with sun behind"). Ships
immediately, works offline, zero payload. Also serves permanently as the fallback for
Firefox and any browser without WebGPU.

**Tier 1 — Chrome Prompt API, feature-detected.**
Zero app payload. `LanguageModel.availability()` → if ready, route utterances through it
with `responseConstraint: SceneRequestSchema`. Falls back to Tier 0 silently when absent.
This is the best value in the whole design: full NL understanding at no download cost for a
large share of users.

**Tier 2 — WebLLM 230M/350M, opt-in.**
For non-Chrome WebGPU browsers, behind an explicit "enable natural language" click that
discloses the ~150–220 MB download. Never blocks first paint.

A hosted model stays unnecessary. Tier 1 covers Chrome at zero cost; Tier 0 covers the rest
adequately. This preserves the project's serverless property, which the earlier research
identified as worth protecting.

---

## 5. Open questions worth testing

- **Can a 230M model reliably fill the full schema?** Extraction with closed enums is its
  strength, but the compound cases (§2.1 row 3, with `secondary` + `event` + `animate`) are
  the stress test. Unverified — needs a phrasing corpus run against both tiers.
- **Gemini Nano quality on this schema.** Should be comfortable, but untested here.
- **Latency.** First-token latency on a 350M model under WebGPU, while a render loop is
  running and competing for the GPU, is unmeasured. Mitigation if it bites: pause
  propagation during inference (positions barely move).
- **Chrome 150 timing.** Full origin-trial promotion expected end of 2026; verify status
  before relying on it in production.

Suggested harness: a fixture file of ~40 utterances with expected `SceneRequest` outputs,
runnable against Tier 0, Tier 1, and Tier 2 to compare accuracy directly. That file is worth
writing before any model integration — it defines "working."

---

## Sources

- [The Prompt API — Chrome for Developers](https://developer.chrome.com/docs/ai/prompt-api)
- [Structured output support for the Prompt API](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api)
- [Gemini Nano in the Browser: Chrome 148 (2026)](https://pasqualepillitteri.it/en/news/3145/gemini-nano-chrome-built-in-ai-client-side-en)
- [Google's Prompt API and the 4GB Gemini Nano Deployment](https://earezki.com/ai-news/2026-05-06-googles-prompt-api/)
- [WebLLM — MLC AI](https://github.com/mlc-ai/web-llm)
- [A Guide to In-Browser LLMs — Intel](https://www.intel.com/content/www/us/en/developer/articles/technical/web-developers-guide-to-in-browser-llms.html)
- [Transformers.js vs Web-LLM: Which Is Faster?](https://zenvanriel.com/ai-engineer-blog/transformers-js-vs-web-llm-which-is-faster/)
- [Constrained decoding: forcing LLM output to a grammar](https://zeroentropy.dev/concepts/constrained-decoding/)
- [A Guide to Structured Generation Using Constrained Decoding](https://www.aidancooper.co.uk/constrained-decoding/)
- [Generating Structured Outputs from Language Models: Benchmark and Studies](https://arxiv.org/html/2501.10868v1)
