# Astroagent — rendering, data sources, request minimisation

Research date: 2026-09-18. Every network claim below was verified by request from this
machine on that date, not taken from documentation. Where docs and observed behaviour
disagreed, the observation wins and the disagreement is noted.

---

## Executive summary

Three findings reshape the obvious design:

1. **The JPL APIs cannot be called from the browser.** `ssd-api.jpl.nasa.gov` returns no
   `Access-Control-Allow-Origin` header at all. Direct `fetch()` from the app will fail.
2. **The whole dataset is small enough to be a build-time asset.** All 2,549 potentially
   hazardous asteroids with full-precision orbital elements is **73 KB gzipped**. This is
   not an API-polling problem; it is a static-file problem.
3. **Orbital elements are quasi-static.** They are published on the Minor Planet Center's
   200-day standard epoch grid. The current epoch rolls over on **2026-12-26**. The correct
   cache TTL is measured in months.

Taken together: the lowest-request design makes **zero API calls at runtime**. Fetch at
build time, ship a static asset, and treat live APIs as an optional enrichment tier.

---

## 1. Data sources

### 1.1 CORS — the constraint that drives everything

Measured with an `Origin: http://localhost:5173` header:

| Endpoint | Status | `Access-Control-Allow-Origin` | Browser-callable |
|---|---|---|---|
| `ssd-api.jpl.nasa.gov/sbdb_query.api` | 200 | *absent* | **No** |
| `ssd-api.jpl.nasa.gov/cad.api` | 200 | *absent* | **No** |
| `ssd-api.jpl.nasa.gov/fireball.api` | 200 | *absent* | **No** |
| `ssd.jpl.nasa.gov/api/horizons.api` | 200 | *absent* | **No** |
| `api.nasa.gov/neo/rest/v1/*` (NeoWs) | 200 | `*` | **Yes** |
| `minorplanetcenter.net/Extended_Files/*` | 200 | `*` | **Yes** |

A correction to what circulates online: several sources describe this as a deliberate
"NASA CORS policy" forbidding embedding. What is actually observable is simpler — the JPL
SSD/CNEOS endpoints just do not emit CORS headers. The effect is the same (no browser
access), but the framing matters: there is no header or referrer trick that unlocks it. The
request must move off the browser, to build time or a proxy.

### 1.2 The three usable sources

**A. JPL SBDB Query API** — *primary, build time only*

```
https://ssd-api.jpl.nasa.gov/sbdb_query.api
  ?fields=full_name,epoch,e,a,i,om,w,ma,H,diameter
  &sb-kind=a&sb-group=pha
  &full-prec=1
```

- Counts measured today: **42,431 NEOs**, **2,549 PHAs**.
- Response is **columnar** (`fields` array + `data` array-of-arrays), not objects — compact,
  and maps directly onto typed arrays.
- Field names are case-sensitive. Use `spkid`/`pdes` as stable identifiers; the docs warn
  `id` format may change without notice.
- `diameter` is **missing for 2,209 of 2,549 PHAs** (87%). Size must be derived from `H`
  (absolute magnitude), which is present for all of them. Plan the visual encoding around
  `H`, not `diameter`.

**B. Minor Planet Center extended files** — *independent fallback, browser-callable*

```
https://www.minorplanetcenter.net/Extended_Files/nea_extended.json.gz
```

- 5.0 MB gzipped / 26.9 MB raw, **42,446 NEA records**, `Access-Control-Allow-Origin: *`.
- Full-precision elements, same epoch (2461200.5), no API key, no proxy.
- Different organisation from JPL — so it is a *real* fallback, not a correlated one. A JPL
  outage does not take this down.
- Field names differ and must be mapped:

  | MPC | SBDB | meaning |
  |---|---|---|
  | `a`, `e`, `i` | `a`, `e`, `i` | same |
  | `Node` | `om` | longitude of ascending node |
  | `Peri` | `w` | argument of perihelion |
  | `M` | `ma` | mean anomaly |
  | `Epoch` | `epoch` | JD |
  | `H`, `G` | `H`, `G` | magnitude |

**C. NASA NeoWs** — *optional live enrichment only*

- The only NASA JSON API that is genuinely browser-callable (`ACAO: *`).
- **`DEMO_KEY` is limited to 10 requests/hour** — measured directly from
  `x-ratelimit-limit: 10`, with `x-ratelimit-remaining` decrementing per call. Widely
  repeated claims of "1,000/hour" apply to a *registered* key, not the demo key.
- Returns close-approach records, not orbital elements suitable for a full orbit plot. Its
  value is "what is passing close today", not scene geometry.
- Get a free key at api.nasa.gov if this tier is used at all; keep it out of git.

### 1.3 No HTTP caching is offered

SBDB returns **no `ETag`, no `Cache-Control`, no `Last-Modified`, and no `Expires`**.
Conditional requests (`If-None-Match` / `If-Modified-Since`) are therefore impossible.
Caching must be entirely client-managed with a self-imposed TTL.

It also **does not honour `Accept-Encoding: gzip`** — a 251 KB response crosses the wire as
251 KB. Self-hosting the same data gzipped is a 3.5× bandwidth win on top of removing CORS.

---

## 2. Position computation — validated, not assumed

The app does **not** need an ephemeris service. Two-body Keplerian propagation from static
elements is accurate enough, and this was measured rather than asserted.

### 2.1 Algorithm (JPL `approx_pos`)

1. Mean motion from Kepler's third law: `n = k / sqrt(a³)`, `k = 0.01720209895` (Gaussian
   gravitational constant, rad/day).
2. Mean anomaly at time *t*: `M = M₀ + n·(t − epoch)`, wrapped to `[−π, π]`.
3. Solve Kepler's equation `M = E − e·sin E` by Newton–Raphson:
   - start `E₀ = M + e·sin M`
   - iterate `ΔE = (M − (E − e·sin E)) / (1 − e·cos E)`
   - converges to 1e-12 in **well under 10 iterations**, even at e = 0.83.
4. Orbital-plane coordinates:
   `x' = a(cos E − e)`, `y' = a√(1−e²)·sin E`, `z' = 0`
5. Rotate to heliocentric ecliptic (Ω, i, ω):
   ```
   x = (cosω·cosΩ − sinω·sinΩ·cos i)·x' + (−sinω·cosΩ − cosω·sinΩ·cos i)·y'
   y = (cosω·sinΩ + sinω·cosΩ·cos i)·x' + (−sinω·sinΩ + cosω·cosΩ·cos i)·y'
   z = (sinω·sin i)·x'                  + (cosω·sin i)·y'
   ```

### 2.2 Accuracy, measured against JPL Horizons

Test case chosen as the **worst case**: 1566 Icarus, e = 0.827 — highly eccentric, the
hardest common object to propagate. Propagated 101 days from epoch 2461200.5 to
2026-09-18, compared against Horizons `EPHEM_TYPE=VECTORS`, `CENTER=500@10`, ecliptic frame:

| Element precision | Position error | Relative error |
|---|---|---|
| SBDB default (4 s.f.) | 24,965 km | 0.0129 % |
| **`full-prec=1`** | **2,004 km** | **0.0010 %** |

`full-prec=1` buys a **12.5× accuracy improvement for 23% more bytes**. Take it.

The residual ~2,000 km is planetary perturbation, irreducible without n-body integration.
At any plausible screen scale this is far below one pixel: at 1 AU ≈ 500 px, 2,000 km is
~0.007 px. Two-body propagation is not a compromise here — it is indistinguishable.

**Implication:** elements are valid for the full ~200-day epoch period. There is no
accuracy-driven reason to re-fetch more often than the epoch rolls.

---

## 3. Request minimisation

### 3.1 The tiering

The design goal should be **zero runtime requests on the happy path.**

**Tier 0 — build-time bake (recommended primary).**
A `scripts/fetch-elements.ts` run under Node (no CORS in Node) hits SBDB once, trims to
render-relevant fields, rounds to 6 decimal places, writes `public/elements.json`. Vite
serves it; the host gzips it.

Measured cost of the trimmed columnar payload:

| Form | Bytes |
|---|---|
| Raw SBDB response, full-prec | 307,970 |
| Trimmed + rounded JSON | 155,864 |
| **Trimmed + gzipped** | **72,605** |

73 KB, served from the app's own origin, cached by the browser like any other asset. This
is smaller than most hero images. Re-run the script when the epoch rolls — roughly twice a
year — and commit the result.

**Tier 1 — client cache.** If live fetching is added later, cache in **IndexedDB**, not
`localStorage`. `localStorage` caps at ~5 MB per origin and is synchronous (it blocks the
main thread, which matters when a render loop is running). IndexedDB is async and has
gigabyte-scale quota. Store `{data, fetchedAt, epoch}` and treat it as fresh until the next
200-day epoch boundary, not on a wall-clock timer.

**Tier 2 — live enrichment, throttled.** NeoWs only, for "close approaches today". At most
one call per session, coalesced. Respect `x-ratelimit-remaining` from the response headers
and stop when it nears zero.

### 3.2 Epoch schedule — the real TTL

Epochs sit on the MPC 200-day grid. Verified by decoding the JDs present in the data:

| JD | Date |
|---|---|
| 2460800.5 | 2025-05-05 |
| 2461000.5 | 2025-11-21 |
| **2461200.5** | **2026-06-09** ← current, 101 days old |
| 2461400.5 | 2026-12-26 ← next refresh |

2,438 of 2,549 PHAs (96%) share the current epoch exactly; the remaining 111 are spread
over 111 older epochs (poorly observed objects). **Do not assume a single global epoch** —
propagate each object from its own `epoch` field. The cost is one subtraction per object.

### 3.3 Fallback chain

Each tier is independent of the one before it, so a single outage cannot empty the screen:

1. **Bundled static asset** — always present, no network. Cannot fail.
2. **IndexedDB cache** — survives offline reload.
3. **MPC extended file** — different organisation, CORS-enabled, works if JPL is down.
4. **Degraded mode** — render planets only (their elements are hardcoded constants from
   JPL's `approx_pos` tables and need no network at all) plus a clear "asteroid data
   unavailable" state.

Because tier 1 is a bundled asset, **the app renders correctly with the network entirely
off**. That is the strongest possible answer to "fallbacks for when the API is down": the
API being down is not on the critical path.

Practical hardening for any request that is made: wrap in `AbortController` with a ~10 s
timeout, retry once with jittered backoff, never retry a 4xx, and treat 503 (documented as
"server overloaded/maintenance") as a definite fall-through rather than a retry.

---

## 4. Three.js rendering

Verified against the installed `three@0.186.0` in `node_modules`.

### 4.1 Scale and precision

The central problem is dynamic range: the Sun is 1.4 M km across, asteroids are sub-km, and
orbits span AUs. Float32 depth precision will z-fight badly.

- **Work in AU**, not km — keeps coordinates in a float-friendly range near 1.0.
- Do **not** render bodies at true scale; nothing would be visible. Use a separate,
  exaggerated size scale for bodies while keeping orbital distances true. This is standard
  practice in every solar-system visualisation and is the honest tradeoff to document in
  the UI.
- `logarithmicDepthBuffer: true` on the renderer solves z-fighting across huge ranges, but
  it carries a real performance cost with many overlapping objects and has had
  desktop/mobile inconsistencies. **Prefer fixing scale first**; reach for the log buffer
  only if z-fighting actually appears.

### 4.2 Drawing the asteroids — `Points`, not `InstancedMesh`

For 2,549 (or 42,431) bodies where each is a dot of a few pixels:

- **`Points` with a single `BufferGeometry`** is the right call. One draw call, one
  `Float32Array` of positions updated per frame, no per-object matrix maths. At this count
  the position update is trivially fast.
- `InstancedMesh` is the correct tool when instances need real geometry, rotation, or
  per-instance lighting. Here they do not — they are dots. `InstancedMesh` would mean
  composing 2,549 4×4 matrices per frame for no visual gain.
- Encode magnitude/size via the `size` attribute and a custom shader, and hazard status via
  a per-vertex `color` attribute. Both ride along in the same buffer — still one draw call.
- Recompute positions into the existing `Float32Array` and set
  `geometry.attributes.position.needsUpdate = true`. Never rebuild the geometry per frame.

Switch to `InstancedMesh` only for the handful of objects the user has selected and zoomed
into, where actual shape matters.

### 4.3 Drawing the orbits

An orbit is a static ellipse in a tilted plane — compute it **once**, not per frame.

- Sample the ellipse in the orbital plane (~128 points is smooth at typical zoom; raise for
  high eccentricity where perihelion curvature is sharp), apply the *same* Ω/i/ω rotation
  matrix as §2.1 step 5, and store as a `BufferGeometry`.
- `EllipseCurve` exists but is 2D; it still needs the 3D rotation applied afterwards, so
  generating points directly is simpler and avoids a conversion step.
- **`LineBasicMaterial` ignores `linewidth` on virtually all platforms** — it is a WebGL
  limitation, not a three.js bug. For orbits that need visible weight, use the fat-line
  addons, confirmed present at
  `node_modules/three/examples/jsm/lines/` (`Line2`, `LineGeometry`, `LineMaterial`).
- Drawing 2,549 orbits at once is visual mush *and* 2,549 draw calls. Draw orbits only for
  selected/highlighted objects, or merge many into one `LineSegments` geometry.

### 4.4 Planets, Sun, stars

- **Planets:** the same Keplerian code path, with elements and per-century rates from JPL's
  `approx_pos` tables (1800–2050). These are constants — hardcode them, zero network.
  Note the Jupiter–Neptune mean anomaly needs the extra `b·T² + c·cos(fT) + s·sin(fT)`
  correction terms from Table 2b.
- **Sun:** a `Mesh` with an emissive material plus a `PointLight` at the origin. Bloom via
  `UnrealBloomPass` if post-processing is wanted later.
- **Stars:** a `Points` cloud on a large sphere with `depthWrite: false`, rendered first.
  Random placement reads fine; a real catalogue (HYG database) is a later refinement.
- **Controls:** `OrbitControls` from `examples/jsm/controls/` — confirmed present. Enable
  damping.

### 4.5 Renderer choice

`three@0.186` ships `three.webgpu.js` and TSL. WebGPU has been production-ready since r171
and `WebGPURenderer` falls back to WebGL2 automatically. That said — this scene is one
`Points` cloud and a few lines. **`WebGLRenderer` is entirely sufficient and simpler to
debug.** WebGPU is worth revisiting only if the object count grows into the hundreds of
thousands or position updates move to a compute shader.

---

## 5. Recommended shape

```
scripts/fetch-elements.ts   → Node, build time, hits SBDB with full-prec=1, writes asset
public/elements.json        → ~73 KB gzipped, committed, refreshed ~2×/year
src/orbital/kepler.ts       → solveKepler(), propagate() — pure, testable
src/orbital/elements.ts     → planet constants from approx_pos tables
src/render/asteroids.ts     → single Points cloud
src/render/orbits.ts        → static line geometry, selected objects only
src/data/source.ts          → tiered loader: asset → IndexedDB → MPC → degraded
```

The pure functions in `orbital/` are worth testing directly — the Horizons check in §2.2 is
reproducible as a unit test with a hardcoded expected vector, which pins the maths against
an authoritative source permanently.

**Next epoch refresh: 2026-12-26.**

---

## Sources

- [SBDB Query API](https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html)
- [SBDB Close Approach Data API](https://ssd-api.jpl.nasa.gov/doc/cad.html)
- [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html)
- [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html)
- [Approximate Positions of the Planets (`approx_pos`)](https://ssd.jpl.nasa.gov/planets/approx_pos.html)
- [Small-Body Orbits & Ephemerides](https://ssd.jpl.nasa.gov/sb/orbits.html)
- [NASA Open APIs / NeoWs](https://api.nasa.gov/)
- [MPC Orbit (MPCORB) Database](https://minorplanetcenter.net/iau/MPCORB.html)
- [MPC ORB JSON format](https://minorplanetcenter.org/mpcops/documentation/mpc-orb-json/)
- [Kepler's equation](https://en.wikipedia.org/wiki/Kepler%27s_equation)
- [three.js InstancedMesh vs Points discussion](https://discourse.threejs.org/t/better-performance-instanced-mesh-or-points/20293)
- [three.js logarithmicDepthBuffer docs](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.logarithmicDepthBuffer)
- [Beware of logarithmic depth buffer (three.js forum)](https://discourse.threejs.org/t/beware-of-logarithmic-depth-buffer-it-can-degrade-scene-performance/88495)
- [three.js WebGPURenderer manual](https://threejs.org/manual/en/webgpurenderer.html)
- [Storage quotas and eviction criteria (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
