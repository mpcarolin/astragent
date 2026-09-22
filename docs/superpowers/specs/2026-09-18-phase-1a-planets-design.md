# Phase 1A: planets orbiting the sun

Date: 2026-09-18. Status: design approved in conversation, awaiting written review.
Source of requirements: `docs/goal.md`. Research: `docs/research/`.

## 1. Scope

Phase 1A ends when `pnpm dev` shows the sun and the eight planets orbiting it at true
orbital distances, lit by the sun alone, with orbit controls, all running locally with no
network calls at runtime. Positions come from a pure simulator validated against JPL
Horizons.

Out of scope for 1A, each planned as a later addition that changes nothing designed here:
asteroids, moons, a starfield, labels, UI controls, deployment, and state-preserving hot
reload. Phase 1B begins with state-preserving hot reload, then adds asteroids.

Orbit lines (pulled into 1A 2026-09-21): without them the planets read as eight scattered
dots rather than a system of nested ellipses — at the current `DAYS_PER_SECOND` the outer
planets barely appear to move, so nothing on screen conveys the plane of the ecliptic, the
eccentricity of Mercury, or the scale gap between the inner and outer planets. They cost
nothing designed here: no change to the simulator, the types, `update`, or the frame loop.
They add one pure sampler (`simulator/ellipse.ts`) and one scene builder
(`scene/createOrbitLines.ts`), and the geometry is built once at startup and never touched
per frame. This strikes `orbit lines` from the out-of-scope list above.

Labels, picking, and focus (pulled into 1A 2026-09-22, "phase 1C"): nine textured spheres
on eight ellipses, and nothing on screen says which planet is which or lets you inspect one.
The scale argument is the decisive one. A planet's radius is `radiusKm / KM_PER_AU *
RADIUS_SCALE`, so Earth is **0.043 scene units** against orbits spaced 10 units per AU: at
the default camera distance of 150 a planet is one or two pixels. Raycasting those spheres
is close to unusable, so the primary click target is a DOM label, not the mesh — which is
the argument for `CSS2DRenderer` over sprites. The mesh raycast (`scene/pick.ts`) is wired
as a secondary path that works once zoomed in. This strikes `labels` from the out-of-scope
list above. `CSS2DRenderer` ships inside `three@0.186.0` under `examples/jsm/renderers/`,
reachable through the `three/addons` alias already used by `createControls`, so no
dependency is added.

Teaching protocol suspended for this phase at the owner's request: §12's split does not
apply to 1C, and the assistant wrote every file. Recorded so §12 reads as paused, not
violated.

## 2. Conventions

- One exported function per file, and the file is named exactly after that function. Names
  are one word, two at most. Files under `types/`, `constants/`, `data/jpl/planets.ts`,
  `data/jpl/types.ts`, `data/solar.ts`, and `scene/appearance.ts` hold data or types and
  are the only exceptions. `utils/` may group files in subfolders by domain.
- No code comments in code the assistant writes. The one permitted marker is a thrown
  `Error("TODO(human)")` in a stub body, which is removed when the function is implemented.
  This doesn't bind code the owner writes themselves.
- Tests are colocated: `<filename>.test.ts` next to the file it tests, same folder. `test/`
  holds only `fixtures/`.
- Functional style. Every function takes plain inputs and returns a value. The exceptions
  are the three.js mutation sites named in section 8. No variable is reassigned in 1A;
  the frame loop carries its state by closure. 1B adds one shared slot in `main.ts` when
  hot reload needs to hand state in from outside.
- The simulator, types, state, utils, and data never import three.js.
- Every number that could be tuned lives in `src/constants/`, never inline.
- Angles are radians everywhere except inside `data/jpl/`, where the table is kept in
  the degrees JPL publishes. Distances are AU. Time is a Julian date number.
- Commits are made by the owner, not the assistant.

## 3. Layout

```
src/
  main.ts                 startup and the frame loop; the only mutable state
  constants/
    astronomy.ts          KM_PER_AU, J2000 (2451545.0), GAUSSIAN_K (0.01720209895)
    camera.ts             FOV, NEAR, FAR, START_POSITION
    light.ts              INTENSITY, DECAY, COLOR
    scale.ts              DISTANCE_SCALE, RADIUS_SCALE, STAR_RADIUS, SCENE_RADIUS
    space.ts              backdrop colours, falloff, texture size
    annotations.ts        orbit-line segments, colour, opacity
    textures.ts           texture folder, anisotropy, the untinted white
    time.ts               DAYS_PER_SECOND, START_DATE (ISO string, or null for now)
  types/
    appearance.ts  body.ts  elements.ts  handles.ts  located.ts  orbit.ts  state.ts  vec3.ts
  utils/
    add.ts  radians.ts  wrap.ts
    date/
      julian.ts           Date or ISO string to Julian date
  data/
    solar.ts              the solar system body list: the sun plus the JPL planets
    orbits.ts             sampled orbit points per body id, for the drawn lines
    jpl/
      types.ts            JplPlanet, the row as JPL publishes it
      planets.ts          Table 2a and 2b constants for the eight planets
      elementsAt.ts       the JPL evolution model
      toPlanet.ts         JplPlanet to Body
  simulator/
    kepler.ts  position.ts  propagate.ts  simulate.ts  ellipse.ts
  state/
    initial.ts  tick.ts
  scene/
    appearance.ts         colour, physical radius, and texture file per body id
    createRenderer.ts  createCamera.ts  createControls.ts  createScene.ts
    backdrop.ts
    createStar.ts  createPlanet.ts  createAmbient.ts  toScene.ts  update.ts  resize.ts
    createOrbitLines.ts
    loadTextures.ts       the one async function; body ids to loaded textures
public/
  textures/               the nine 2048 x 1024 body maps, served as static assets
    CREDITS.md            the CC BY 4.0 attribution the licence requires
scripts/
  horizons.ts             standalone Node script, writes the fixtures
test/
  fixtures/horizons.json
docs/
  definitions.md
  superpowers/specs/
```

Dependency direction: `main` imports everything. `scene` imports `types`, `constants`,
`utils`. `simulator` imports `types`, `utils`. `data` imports `types`, `utils`,
`constants/astronomy`. `state` imports `types`, `constants/time`. Nothing imports `main`.

Clarified 2026-09-21, when orbit lines landed: `scene` takes its data as parameters and
imports no `data` and no `simulator`. `createScene` had drifted from this — it imported
`data/solar` directly — and now receives the body list and the sampled orbit points as
arguments instead. `createOrbitLines` likewise takes already-sampled `TVec3` points rather
than a body, so it needs no `simulator` import to build the geometry. Everything
three.js-specific stays inside `scene`; everything that decides *what* to draw is passed in.

The sampling itself lives in `data/orbits.ts`, not in `main`: deciding which bodies get a
line and at what resolution is a question about the data, and `main` is startup and the
frame loop, nothing else. This extends the direction above — `data` also imports
`simulator` (for `ellipse`) and `constants/annotations`. `main` calls
`createScene(solar, orbits(solar, start.date))` and composes nothing itself.

## 4. Types

```ts
type Vec3 = { readonly x: number; readonly y: number; readonly z: number }

type KeplerianElements = {
  readonly semiMajorAxis: number        // AU
  readonly eccentricity: number
  readonly inclination: number          // rad
  readonly ascendingNode: number        // rad, Ω
  readonly argumentOfPerihelion: number // rad, ω
  readonly meanAnomaly: number          // rad, M
}

type Orbit = { readonly parent: string; readonly elementsAt: (jd: number) => KeplerianElements }

enum EBodyKind { Star = "star", Planet = "planet", Moon = "moon", Asteroid = "asteroid" }

type Body =
  | { readonly kind: EBodyKind.Star; readonly id: string; readonly name: string }
  | { readonly kind: EBodyKind.Planet | EBodyKind.Moon | EBodyKind.Asteroid; readonly id: string; readonly name: string; readonly orbit: Orbit }

type Located = { readonly body: Body; readonly position: Vec3 }

type State = { readonly jd: number; readonly daysPerSecond: number }

type Appearance = { readonly color: number; readonly radiusKm: number; readonly texture: string }

type Handles = { readonly scene: Scene; readonly bodies: ReadonlyMap<string, Mesh> }
```

The annotations above are for this document only; the source files carry none.
`handles.ts` uses `import type` from three.js, erased at compile time. Body ids are
`sun`, `mercury`, `venus`, `earth`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`.

`Handles` corrected 2026-09-21: it is `{ scene, bodies }`. The five-field shape written
here originally was never built — the renderer, camera, and controls stay as locals in
`main`, and only the scene and the body meshes need to cross a function boundary. `update`
and the loop take what they need directly.

Revised 2026-09-21: the kind discriminant is an `enum EBodyKind`, not a string-literal
union, and the `T`-prefix convention of section 2 gives way to `E` for enums. Narrowing is
unaffected — `body.kind !== EBodyKind.Star` still narrows `TBody` to `TOrbiter`, and
`TStar` has no `orbit`. Two consequences were accepted deliberately. A string enum will not
accept a bare string literal, so `{ kind: "star" }` no longer compiles and every body
literal names the member; all eleven call sites were converted in the same change, so the
tree has no residual errors. And an `enum` emits runtime JavaScript, unlike a type, so
`data/solar.ts` and `data/jpl/toPlanet.ts` carry value imports of `types/body` rather than
`import type`. A `const` object with a matching type would have avoided both, but the
named members were wanted at call sites.

`Orbit.elementsAt` is a closure built by the source's transformer. It is a record holding
a function, not an object with methods: no `this`, no mutation. It is the one shape every
source reduces to, and the simulator never learns which source produced it.

## 5. Data

### 5.1 JPL planets

`JplPlanet` mirrors one row of JPL's "Approximate Positions of the Planets" tables:
`id`, `name`, `elements` and `rates` each holding `a`, `e`, `i`, `L`, `longPeri`, `node`,
and for Jupiter, Saturn, Uranus, and Neptune a `corrections` record of `b`, `c`, `s`, `f`.
Values are copied from Table 2a and 2b (valid 3000 BC to 3000 AD) exactly as published,
in AU, degrees, and degrees per century, so the file can be checked against the source by
eye. Table 2 is chosen over Table 1 because the Phase 5 100-year slider reaches 2076,
past Table 1's 2050 limit.

`elementsAt(row, jd)`:

1. T = (jd − J2000) / 36525, centuries from J2000.
2. Each element = value + rate × T.
3. ω = ϖ − Ω. M = L − ϖ + b·T² + c·cos(f·T) + s·sin(f·T), with f·T in degrees and the
   correction terms zero when the row has none.
4. Convert i, Ω, ω, M to radians and return `KeplerianElements`.

`toPlanet(row)` returns a `Body` of kind `planet` with `orbit.parent = "sun"` and
`orbit.elementsAt = (jd) => elementsAt(row, jd)`.

JPL's Earth row is the Earth–Moon barycentre, under 5,000 km from Earth's centre. The
moons phase will revisit this.

### 5.2 Solar system

`data/solar.ts` exports `solar`, the body list for our system: the sun,
`{ kind: EBodyKind.Star, id: "sun", name: "Sun" }`, followed by `planets.map(toPlanet)`.
Another system later is another file with the same shape.

`data/orbits.ts` (added 2026-09-21) exports `orbits(bodies, jd)`, a `ReadonlyMap` from body
id to the sampled points of that body's drawn orbit, skipping the star. It is what
`createScene` is handed so that `scene` needs no `data` or `simulator` import of its own.
It reads `ORBIT_SEGMENTS` from `constants/annotations.ts` and calls `simulator/ellipse.ts`,
which is why `data` imports `simulator` — see the dependency note in section 3. Adding a
second system means calling it with that system's body list; nothing here is specific to
the sun.

## 6. Simulator

- `kepler(meanAnomaly, eccentricity)` wraps M to [−π, π], starts from
  E₀ = M + e·sin M, iterates Newton–Raphson ΔE = (M − (E − e·sin E)) / (1 − e·cos E) until
  |ΔE| < 1e-12 or fifty iterations, and returns E.
- `position(elements)` calls `kepler`, computes orbital-plane coordinates
  x′ = a(cos E − e), y′ = a√(1 − e²)·sin E, and rotates by Ω, i, ω into the parent's
  ecliptic frame:

  ```
  x = (cos ω cos Ω − sin ω sin Ω cos i)·x′ + (−sin ω cos Ω − cos ω sin Ω cos i)·y′
  y = (cos ω sin Ω + sin ω cos Ω cos i)·x′ + (−sin ω sin Ω + cos ω cos Ω cos i)·y′
  z = (sin ω sin i)·x′                     + (cos ω sin i)·y′
  ```

  Returns a `Vec3` with z toward ecliptic north.
- `ellipse(elements, segments)` (added 2026-09-21) returns `segments` points tracing the
  whole orbit, by sweeping the *eccentric* anomaly uniformly rather than the mean anomaly.
  Mean anomaly is uniform in time, not in arc, so sampling it obeys Kepler's second law and
  bunches points at aphelion while thinning them at perihelion — exactly backwards for a
  polyline, and visible as a faceted perihelion at Mercury's e = 0.206. Kepler's equation
  runs the cheap way in reverse to fix it: for an evenly spaced E, feed `position` the
  M = E − e·sin E that yields it, and `position` solves back to the E chosen. This keeps
  `position` untouched and the Ω/i/ω rotation in exactly one place, so a line and its
  planet cannot disagree. The first point is perihelion; the last is not a repeat of it,
  because closing the ring is the renderer's job. `segments` is a parameter rather than a
  constant read so the function stays pure and testable at small counts.
- `propagate(body, jd)` returns the body's position relative to its parent: the origin for
  a star, otherwise `position(body.orbit.elementsAt(jd))`.
- `simulate(bodies, jd)` returns `readonly Located[]` in input order with absolute
  positions. A star is at the origin. An orbiting body is its parent's absolute position
  plus `propagate(body, jd)`, resolved recursively through the parent chain. A parent id
  not in the list throws. In 1A every parent is the sun, but the recursion is written and
  tested now so the type does not promise what the code cannot do.

### 6.1 Utilities

- `add(a, b)`: component-wise `Vec3` sum.
- `julian(value)`: `Date` or ISO string to Julian date, `ms / 86400000 + 2440587.5`.
  UTC is treated as ephemeris time; the difference is about a minute and moves Mercury by
  a few hundred kilometres.
- `radians(degrees)`.
- `wrap(angle)`: any angle to [−π, π].

## 7. State

`initial(now)` returns `{ jd: julian(START_DATE ?? now), daysPerSecond: DAYS_PER_SECOND }`.
`tick(state, elapsedMs)` returns a new state with `jd` advanced by
`daysPerSecond × elapsedMs / 1000`. These are the first of the transition functions that
agent tools will later be.

Corrected 2026-09-22, against the built code: the file is `state/reducer.ts`, not
`state/tick.ts` as §3, §7 and §12 say; and `TState` is `{ date, rate }`, not
`{ jd, daysPerSecond }`. The shapes above were never built as written.

Revised 2026-09-22, for 1C — `reducer` (renamed from `nextState`) becomes the sole state
machine. Its signature is
`(state: TState, action: TAction) => TState`, switching on `action.kind` over a
discriminated union in `types/action.ts`:

- `EActionKind.Tick` (`elapsedMs`) — the date arithmetic above, carrying `focus` through.
- `EActionKind.Focus` (`targetId`, `startedAt`, `from`, `fromTarget`) — sets `focus`.
- `EActionKind.Release` — sets `focus` to `null`.

Added 2026-09-22, moving pointer interaction out of `main.ts`: the listeners no longer hold
a `let down`, so pointer position becomes state and the drag-vs-click rule becomes the pure
`utils/dragged.ts`. `TState` gains `readonly pointer: TVec2 | null` (`types/vec2.ts`) —
where the pointer went down, or null when it is up or has been dragged.

- `EActionKind.PointerDown` (`x`, `y`) — records `pointer`.
- `EActionKind.PointerMove` (`x`, `y`) — past `DRAG_SLOP`, clears `pointer` and `focus`;
  otherwise returns the state untouched.
- `EActionKind.PointerUp` (`x`, `y`, `focus`) — always clears `pointer`, and adopts the
  carried `focus` only when the press was a click, not a drag.

The pointerup listener raycasts speculatively and pushes a complete action; the reducer
decides click-vs-drag and discards the payload on a drag. That costs one wasted raycast per
drag-release and keeps the reducer the sole decider.

Each arm is a named type of its own, per the union rule in §2. `TState` gains
`readonly focus: TFocus | null` (`types/focus.ts`): **intent and interpolation origin only,
no camera destination**, because the destination re-derives per frame as the planet moves,
and storing it would put scene-space geometry into the type `simulate` reads.

This is the seam §13 promised rather than a detour around it. A reducer *is* "a function
from `State` to `State`"; an agent tool call and a mouse click become the same thing, an
action folded into state. It also avoids inventing a new mutation site for focus — no `let`
in `main.ts`.

`state/queue.ts` holds `push(action)` and `drain(): readonly TAction[]`. It is the one
module owning a mutable array: DOM handlers push, the loop drains, and the mutation is
named in one file rather than smeared across `main.ts`. It is also the one file with two
exports; `CLAUDE.md` names the exception.

## 8. Scene

All scene functions build one three.js object from plain inputs and return it. The
mutation sites in the whole program are: `update`, `resize`, `focus`, and the loop in
`main.ts` (which calls `controls.update()` and `renderer.render()`).

Revised 2026-09-22, for 1C: the list is four, not three. `scene/focus.ts` is the
per-frame camera mutation. The alternative was giving `update` a second job or putting
camera math in the loop; keeping the tween in its own file is worth widening an explicit,
enforceable rule by one. `CLAUDE.md` is updated to match.

- `createRenderer(canvas)`: `WebGLRenderer` on the `#scene` canvas, antialias on, pixel
  ratio capped at 2, sized to the window. No logarithmic depth buffer.
- `createScene(solar, orbits)` (revised 2026-09-21): `Scene` whose `background` is the
  texture from `backdrop()`. A flat black background gave the planets nothing to sit
  against. The scene holds no backdrop geometry. This replaces the "background set to
  black" rule. It takes the body list and a `ReadonlyMap` of body id to sampled orbit
  points, rather than importing `data/solar` itself, so that everything three.js-specific
  is encapsulated here while every decision about *what* to draw is made by the caller.
  It builds a mesh per body, adds an orbit line per entry in `orbits`, and adds the lights.
- `backdrop()` (added 2026-09-21): a `DataTexture` of `BACKDROP_WIDTH` × `BACKDROP_HEIGHT`
  on `EquirectangularReflectionMapping`, used as `scene.background`. Each row is one
  latitude, blending `BACKDROP_ECLIPTIC_COLOR` toward `BACKDROP_POLE_COLOR` by
  `|1 − 2·latitude|` raised to `BACKDROP_FALLOFF`: a faint violet band around the ecliptic
  falling to deep indigo at the poles. All five values are in `constants/space.ts`. The
  blend happens in three.js's linear working space and is converted back to sRGB before the
  bytes are written, because the texture is tagged `SRGBColorSpace`; skipping that step
  darkens the result to near black. It is built once at startup and never touched per frame.

  A backdrop sphere was tried first and rejected. `scene.background` is rendered by the
  renderer without a projection, so nothing can be clipped or occluded at any camera
  distance, and the gradient stays fixed to the ecliptic because the texture is sampled by
  world direction, not by camera orientation. Scene geometry cannot do this here: a
  world-anchored sphere must satisfy radius + `MAX_DISTANCE` < `FAR`, which with
  `MAX_DISTANCE` 400 and `FAR` 500 leaves under 100 units — smaller than Neptune's orbit at
  roughly 301. `depthTest: false` does not help, because far-plane clipping happens in the
  projection, not in the depth test.
- `createCamera()` (revised 2026-09-21): `PerspectiveCamera` built from
  `constants/camera.ts` — FOV 50, NEAR 0.01, `FAR = MAX_DISTANCE + SCENE_RADIUS`, and
  START_POSITION in scene coordinates (AU, y-up) above the ecliptic. Two corrections landed
  here together.

  Revised again 2026-09-22: START_POSITION moved from `{ x: 0, y: 1, z: 150 }` to
  `{ x: 0, y: 150, z: 0 }`, typed `TVec3`, so the scene opens
  looking straight down on the sun instead of nearly edge-on, and the orbits read as nested
  rings rather than overlapping lines. The distance is unchanged. An exact +Y start is
  safe: `Object3D.lookAt` handles the degenerate up-vector case, and `OrbitControls` calls
  `Spherical.makeSafe()` every update, which clamps the polar angle to [1e-6, π − 1e-6] —
  a 1.5e-4 unit nudge at this radius, so no hand-placed tilt is needed to keep the controls
  usable. Simulating the control path's rotate step confirms it: successive drags off the
  pole hold the radius at exactly 150 and move continuously, and a drag back through the
  pole stops at the clamp rather than flipping.

  The same revision struck the claim that START_POSITION frames Neptune's orbit, which was
  false and had never been checked. At FOV 50 the vertical half-extent visible at distance
  d is d·tan 25° = 0.4663 d, so 150 frames a radius of 69.9 — out to Jupiter at 52.0, and
  cutting Saturn at 95.4. The overhead view makes this visible for the first time, because
  edge-on the outer rings ran off the sides rather than obviously overflowing. The start
  distance stays 150: it frames the inner system, which is where the planets are legible,
  and the outer orbits are reachable by zooming.

  Recorded as a constraint rather than fixed, because it bounds any future framing work:
  Uranus and Neptune cannot be framed at all at this FOV. They need distances of 411.6 and
  644.9 against `MAX_DISTANCE` 400, so the camera cannot legally reach a vantage that
  contains them. Whoever wants a whole-system view must raise `MAX_DISTANCE`, widen FOV, or
  both — and `FAR` follows `MAX_DISTANCE` automatically, so only the framing needs thought.

  First, `constants/camera.ts` did not exist. The four values were inline literals in
  `createCamera.ts`, against both section 2's rule that every tunable lives in `constants/`
  and this section's own claim that the camera read from that file. The file now exists and
  the function reads from it.

  Second, `FAR` was a fixed 500 and clipped the outer orbits. This is the same
  radius + `MAX_DISTANCE` < `FAR` constraint written two bullets above, which the backdrop
  decision had already worked out and which a fixed 500 does not satisfy: Neptune's ring
  reaches 303.39 units, the camera pulls back to `MAX_DISTANCE` 400, so the far edge sits at
  703 and everything past 500 was cut. Nothing had been drawn that far out until the orbit
  lines landed, so the arithmetic sat on the page without a visible symptom — the planets
  are points near the middle of their own orbits and never reached the plane. `FAR` is now
  derived from the constraint rather than picked, so raising `MAX_DISTANCE` widens it
  automatically. `SCENE_RADIUS` is 320 in `constants/scale.ts`, with headroom over the
  measured 303.39 for drift in the JPL per-century rates.
- `createControls(camera, canvas)`: `OrbitControls` from `three/addons`, damping on,
  target at the origin.
- `toScene(v)`: `new Vector3(v.x, v.z, −v.y)` scaled by `DISTANCE_SCALE`. This is a
  proper rotation about x that turns ecliptic-north-up into three.js y-up, and the only
  place the two frames meet.
- `createStar(body, appearance)`: `Mesh` of `SphereGeometry(STAR_RADIUS)` and
  `MeshBasicMaterial` in the appearance colour, with a `PointLight` child at its centre
  using `constants/light.ts`. Initial DECAY is 0 so every planet reads lit with a correct
  day and night side; realistic 1/d² falloff is DECAY 2. The star's rendered radius is the
  constant, not the physical radius scaled, because the scaled sun would swallow Mercury.

  STAR_RADIUS validated and corrected 2026-09-22. The reasoning above holds, but the value
  did not. Under the planets' own rule the sun is 695 700 km / KM_PER_AU × RADIUS_SCALE =
  4.65 scene units, and Mercury's perihelion is 0.307 AU × DISTANCE_SCALE = 3.075, so a
  consistently scaled sun does swallow Mercury's orbit and its drawn line. But the chosen
  0.3 overcorrected past the point of sense: Jupiter renders at 0.467, so the sun came out
  smaller than its largest planet where the true ratio is 9.95 : 1, and read as one more
  ball rather than the centre of the system. STAR_RADIUS is now 1.0 — 2.1× Jupiter, 23×
  Earth, and 32% of Mercury's perihelion, so the sun dominates without touching the inner
  orbit. This is a deliberate understatement, not a derivation: the true ratio cannot be
  kept while RADIUS_SCALE and DISTANCE_SCALE differ by 100×, and the sun is the one body
  where that exaggeration runs out of room. The sun's real `radiusKm` in `appearance.ts`
  is therefore unread by `createStar`, which is intended rather than an oversight.

  Recorded 2026-09-22, unfixed, because it is a lighting decision rather than a texture one:
  `INTENSITY` 5000 with `DECAY` 0 overdrives the lit hemisphere so far past white that the
  new colour maps are invisible on the day side. Measured rather than guessed — rendering
  the earth map at 512 x 512 under this section's own ambient light and counting pixels at
  or above 250 in all three channels gives 99.3% of the lit surface fully clipped at
  intensity 5000, 17.0% at 100, 2.1% at 20, 0.3% at 10, and none at 5 or below. On screen
  the effect is unmistakable: earth's night side renders correct continents and ocean while
  its day side is a flat white disc with a hard straight terminator, and jupiter is white
  but for a crescent of banding at the limb.

  Tone mapping does not rescue it. `ACESFilmicToneMapping`, `AgXToneMapping`, and
  `NeutralToneMapping` were each tried on the real scene at this intensity; all three
  darkened the night side and left the day side pure white, which is the expected result,
  since no response curve recovers detail from a signal driven three orders of magnitude
  past its range. The fix is the intensity, and the constraint to respect while choosing one
  is that `DECAY` 0 means every planet from mercury to neptune receives the identical
  irradiance, so a single value must suit all eight at once — which is what makes it a
  decision about the model rather than a number to nudge.

  This was always true; flat colours merely hid it, because a clipped `0x4488ff` still reads
  as a bright blue planet whereas a clipped photograph reads as a bug. The textures did not
  cause the problem, they exposed it.
- `createAmbient()` (renamed from `createLights`, revised 2026-09-22): pure black night
  sides read as visually broken rather than physically correct, so a single `AmbientLight`
  from `constants/light.ts` (`AMBIENT_COLOR`, `AMBIENT_INTENSITY`) sits alongside the
  star's `PointLight`, low enough to keep day/night contrast but not so low the unlit
  hemisphere reads as void. This replaces the "no ambient light" rule below.

  The function returns only the ambient light, because the sun's light belongs to the sun.
  `createLights` had been returning a second `PointLight` at the world origin alongside the
  one `createStar` already attaches as a child of the star mesh — two lights where the
  sentence above promises one, so the code had drifted from this entry rather than the
  entry being wrong. The duplicate is gone and the star keeps its own light, which is the
  better home: the light is a child at the mesh's local origin, so it is wherever the star
  is and follows it if the star ever moves off the origin.

  The two were never equivalent, which is worth recording because it makes the removal
  safe rather than merely tidy. `createStar` passes `DECAY` explicitly, so its light has
  decay 0 and no falloff; the origin light took `PointLight`'s default decay of 2 and fell
  off as 1/d². Against the decay-0 light it contributed 6.3% of the total at Mercury, 1.0%
  at Earth, 0.4% at Mars and under 0.05% from Jupiter outward — a faint inner-system
  brightening, not a structural light. Verified after removal: Earth still renders a sharp
  crescent with the lit limb toward the sun and a blue, non-void night side.

  Naming: a function returning one ambient light should not be named for a plural it no
  longer provides, hence the rename, which also brought the file in line with section 2 —
  it had been using a namespace `import * as THREE`, an arrow-function export, and no
  `import type` group.
- `createPlanet(body, appearance)`: `Mesh` of `SphereGeometry` and `MeshStandardMaterial`
  with the appearance colour, roughness 1, metalness 0. Radius is
  `radiusKm / KM_PER_AU × RADIUS_SCALE`, linear. If no constant keeps both Mercury visible
  and Jupiter sane, the mapping gets its own function and goes sub-linear, decided after
  looking. `mesh.name` is the body id.
- `appearance.ts`: `Record<string, Appearance>` keyed by body id for the nine 1A bodies,
  colours chosen for recognisability, radii the NASA fact-sheet mean radii in km. A body
  with no entry is a startup error. 1B adds a per-kind fallback.

  Extended 2026-09-22, when textures landed: each entry gains a `texture`, the file name of
  that body's colour map inside `public/textures/`. The name rather than a path, so the
  folder is named once in `constants/textures.ts` and a body cannot point outside it. The
  `color` stays and is not dead: it is what a body renders in when its texture is missing,
  which is the whole fallback path described under `loadTextures` below.
- `loadTextures(ids)` (added 2026-09-22): the one async function in the program. It returns
  a `Promise<ReadonlyMap<string, Texture>>` keyed by body id, built from one
  `TextureLoader` with its path set to `TEXTURE_PATH`, resolving each id's `texture` file
  through `appearance`. It uses `loader.loadAsync`, not `loader.load`: `load` returns a
  `Texture` immediately and fills it in later by mutation, which would put a mutation site
  outside the three named in this section, whereas `loadAsync` returns a real promise and
  the texture is complete when it resolves.

  Every map is tagged `SRGBColorSpace` explicitly. This is not optional and not a default:
  `Texture`'s constructor sets `NoColorSpace` and `TextureLoader` never changes it, so an
  untagged colour map is sampled as though it were already linear and the planet renders
  visibly washed out. `backdrop` had already worked this out for its `DataTexture` — the
  same rule, arrived at from the other direction, since `backdrop` must convert *into* sRGB
  before writing bytes for exactly the same reason. Verified after loading: the earth map
  reports 2048 x 1024 and `colorSpace` `srgb`.

  Loading is hoisted above the scene graph rather than threaded into it. `createScene`,
  `createPlanet`, and `createStar` stay synchronous and pure; only `main` awaits. This is
  why the map is a parameter and not a lookup — see the three signature changes below.
- `createStar` and `createPlanet` take a second parameter, `Texture | null`
  (revised 2026-09-22). The texture becomes the material's `map`. When a map is present the
  material's `color` is `UNTINTED` (white) rather than the appearance colour, because
  three.js multiplies `color` into `map`: leaving the sun's `0xffcc33` in place would
  filter its own photograph through an orange gel, and the same applies to every planet.
  When the map is `null` the appearance colour is used exactly as before, so the flat
  spheres this phase shipped with remain the fallback rather than a lost branch.

  The sun is textured too, on a `MeshBasicMaterial`. Unlit is correct for a star — it is the
  light source, so it should not be shaded by one — and a basic material still samples a
  `map`, so the granulation shows without any lighting contribution.
- `createScene(solar, orbits, textures)` (revised 2026-09-22): a third parameter, the map
  from `loadTextures`. Per body it passes `textures.get(body.id) ?? null` down to
  `createStar` or `createPlanet`. The function stays synchronous, and an absent id is not an
  error — it is the flat-colour fallback.
- `createOrbitLines(points)` (added 2026-09-21): a `LineLoop` over the already-scaled
  scene positions of `points`, one three-component vertex each in a `Float32Array` handed
  to `BufferGeometry.setAttribute("position", …)`, written by computed offset the way
  `backdrop` fills its `Uint8Array`. `LineLoop` rather than `Line` closes the ring without
  a duplicated vertex — note `LineLoop extends Line`, so an `instanceof Line` assertion
  cannot tell them apart. The material is a `LineBasicMaterial` in `ORBIT_COLOR` at
  `ORBIT_OPACITY`, `transparent`, with `depthWrite: false` so a faint line never occludes a
  planet behind it and `toneMapped: false` so the sun's intensity cannot brighten it.
  `linewidth` is deliberately not set: it is ignored on virtually every WebGL platform, a
  limitation of the graphics API rather than a three.js bug, so faintness comes from colour
  and opacity. Real line weight would mean `Line2`/`LineGeometry`/`LineMaterial` from
  `three/addons/lines/`, at the cost of a fatter material and per-resize resolution
  updates. The geometry is built once at startup and never touched per frame; a later
  date-slider phase rebuilds it by re-running `ellipse`, which is why the sampler is a
  separate pure function from the builder.
- A single shared cool grey-blue is used for every orbit rather than a faint tint of each
  planet's own `appearance` colour: eight saturated hues at low opacity against a violet
  backdrop read as noise competing with the planets, whereas one neutral line recedes and
  lets the spheres stay the only coloured things in the scene.
- `update(handles, located)`: for each located body, sets the named mesh's position from
  `toScene`.
- `resize(handles)`: sets renderer size and camera aspect, updates the projection matrix.

The night side of a planet is dim, not black: a low `AmbientLight` prevents pure void
(see `createAmbient` above).

The page: `index.html` keeps the `#scene` canvas; a small stylesheet makes it fill the
viewport with no margin on a black body, so nothing flashes before the first frame.

Added 2026-09-22, for 1C — the scene functions this phase adds:

- `createLabelRenderer()` → `CSS2DRenderer`, sized to the window, appended as `#labels`.
  The container is `pointer-events: none` so the overlay never swallows a canvas drag meant
  for `OrbitControls`; `.label` is `pointer-events: auto`, so the text itself stays clickable.
- `createLabels(bodies, meshes, camera, controls)` → `ReadonlyMap<string, CSS2DObject>`.
  One `div` per body, text from `TBody.name`, `data-body-id` set, attached as a child of
  its mesh so it tracks the planet for free. The click handler pushes a `TFocusAction`.
- `occluded(body, sun, camera, sunRadius)` → `boolean`. Pure `TVec3` math, no three.js, so
  it is testable under the `node` vitest environment: project camera→body onto camera→sun,
  and hide when the body lies beyond the sun and within the shadow cone, which widens with
  `along / sunDistance`. **A body nearer the camera than the sun is never occluded.** An
  earlier draft also returned `true` when the projection was negative, reading that as
  "behind the camera"; it is not — it only means "away from the sun", and it wrongly hid
  the very planet being focused. `CSS2DRenderer` already culls behind-camera labels itself.
- `pick(event, camera, meshes)` → `string | null`. Pointer to NDC, `Raycaster.setFromCamera`,
  intersect the meshes, return `object.name` (set to `body.id` in `createScene`) or null.
- `focus(state, located, camera, controls, now)` → `void`. Returns at once when
  `state.focus` is null. Otherwise `k = ease(min(1, (now - startedAt) / DURATION_MS))`,
  `camera.position.lerpVectors(from, toScene(vantage(...)), k)`, the same for
  `controls.target`, then `camera.lookAt(controls.target)`; at `k >= 1` it pushes
  `Release`. It takes the simulated `TLocated[]` rather than the meshes because `vantage`
  works in the ecliptic frame and `toScene` is one-way — this reuses the single frame-change
  seam instead of inventing an inverse.
- `resize(renderer, labels, camera)` → `void`. **The spec named this file in §3, §8, §9,
  §11 and §12 and assigned it to the assistant, but it was never built and `main.ts`
  registered no resize listener — the app did not handle resize at all.** It now sets both
  renderer sizes, the camera aspect, and the projection matrix.

Cleanup pass 2026-09-22 (`/simplify`), after four review agents. The shape above is what
shipped; these are the seams that moved:

- `scene/radius.ts` — `radius(look)` returns a body's scene-frame radius. `createPlanet`
  and `focus` both call it; previously each spelled the `radiusKm / KM_PER_AU * RADIUS_SCALE`
  conversion itself, in two different frames. `RADIUS_SCALE` is a tuning knob the spec
  reasons about repeatedly, and the second copy would have failed *silently* — the camera
  simply landing at the wrong standoff. `focus` divides the one shared result by
  `DISTANCE_SCALE` to reach the ecliptic frame, so the conversion is named in one place.
- `scene/reveal.ts` — `reveal(labels, meshes, starId, camera)` owns the label-visibility
  pass that was inline in the frame loop. It reads positions **from the meshes** that
  `update` just wrote, rather than recomputing `toScene(position)` for every body a second
  time two lines later. `main.ts` shed four imports and the loop became a flat list of calls.
  This is a **fifth mutation site**, sibling to `update`; `CLAUDE.md` names it.
- `scene/focusAction.ts` — builds the `TFocusAction` once. The label click and the canvas
  pick previously constructed the same six-property literal independently, which is the
  asymmetry manual testing misses: a missed edit breaks one input path and not the other.
- `TFocusAction` is now `TFocus & { kind }` rather than a second declaration of the same
  four fields, and the reducer's Focus arm strips `kind` by rest-destructuring instead of
  re-listing every field. Two mutants confirm the tests still pin that `kind` must not leak
  into state.
- The frame loop folds `drain().reduce(reducer, reducer(state, tick))` — one array per
  frame instead of two, same order, no spread.
- Removed: `types/vec2.ts`, a whole type file for one local's annotation, which would have
  collided with the 2D *scene* meaning the first time anyone needed NDC math.

Skipped deliberately: hoisting `pick`'s `Raycaster`/`Vector2` to module scope (a
human-speed event, and it would add mutable module state to a cleanly functional file), and
replacing the hand-rolled drag/click discrimination with OrbitControls' `start` event (it
would cover "user took control" but cannot answer "was this a click or a drag" for the pick,
so it replaces two listeners of three). `element.dataset.bodyId` is unread by the app and
kept as the only external hook on label identity.

Known limitation, recorded rather than quietly redesigned: **focus frames the planet at
landing, then lets it drift.** When `k` reaches 1, `focus` pushes `Release` and
`OrbitControls` resumes with a target fixed in space, so a planet keeps orbiting out of
frame. At `DAYS_PER_SECOND = 2` Mercury laps in about 44 s of wall time and leaves the view
within a few seconds of arrival; the outer planets stay framed far longer. This is what the
plan specified ("the loop pushes a `TReleaseAction`, handing control back to
`OrbitControls`") and it is what shipped, but the acceptance criterion "lands with the
planet framed" is strictly true only at the landing instant. Making focus *sticky* — keeping
`controls.target` glued to the body until the user interrupts — is a separate decision about
whether focus is a one-shot flight or a persistent mode, and belongs with the phase 3/4
camera work now that §13 is answered.

`camera.lookAt(controls.target)` inside `focus` is load-bearing, not decoration. `focus`
runs *after* `controls.update()` in the loop so the lerped position is the last word for
the frame; without the explicit `lookAt` nothing re-aims the camera at the moving target
and the planet lands off-centre.

Two pure helpers sit outside `scene/` because they import no three.js, the same reasoning
that puts `add.ts` in `utils/`:

- `utils/vantage.ts` — `vantage(planet, sun, radius, phase?, elevation?)` → `TVec3`.
  Planet→sun normalised, rotated by `PHASE_ANGLE` about ecliptic up (+z, before `toScene`),
  lerped toward up by `ELEVATION`, re-normalised, scaled by
  `max(radius * ZOOM_FACTOR, MIN_APPROACH)`, added to the planet. Deriving the vantage from
  the *live* sun direction is what gives a night crescent at every planet on every date.
  Note the frame: `radius` and `MIN_APPROACH` are ecliptic-frame (AU-ish) quantities, so
  the caller passes `radiusKm / KM_PER_AU * (RADIUS_SCALE / DISTANCE_SCALE)` — `toScene`
  applies `DISTANCE_SCALE` afterwards, and multiplying twice would bury the camera in the
  planet.
- `utils/ease.ts` — `ease(t)` → cubic in-out, clamped to [0,1].

Tunables: `constants/focus.ts` (`PHASE_ANGLE` 0.65 rad ≈ 37°, `ELEVATION` 0.25,
`ZOOM_FACTOR` 8, `MIN_APPROACH` 0.02, `DURATION_MS` 1200) and `constants/labels.ts`
(`LABEL_CLASS`, `OCCLUSION_MARGIN`, `LABEL_MIN_DISTANCE`). It is `labels.ts` because
`constants/annotations.ts` is already taken by the orbit-line tunables. `DRAG_SLOP` joins
`constants/controls.ts`. The label's vertical offset is a **pixel** value and lives in the
`.label` CSS rule, not in a scene constant.

Also unrecorded until now: `scene/createHud.ts` and `constants/debug.ts` exist in the
built code but appear nowhere in this spec, and `update` takes `(meshes, located)`, not
`(handles, located)` as §8 says.

## 9. Startup and loop

`main.ts`, in order: find the canvas or throw; build renderer, scene, camera, controls;
import `solar` as the body list; build a mesh per body via `createStar` or `createPlanet`
and add each to the scene; assemble `Handles`; register `() => resize(handles)` on the
window's resize event and call it once; start the first frame with `initial(new Date())`.

Revised 2026-09-21, for orbit lines: the start state is hoisted to `const start =
initial(new Date())` so the lines and the loop share one epoch, rather than being
constructed inline in the final `setAnimationLoop` call. `main` then calls
`createScene(solar, orbits(solar, start.date))` and does nothing else with the data.

Revised 2026-09-22, for textures: `main` is now an async module. It awaits
`loadTextures(solar.map((body) => body.id))` before building the scene and passes the
result to `createScene` as its third argument. Top-level `await` is available without a
transform here — the package is `"type": "module"` and `build.target` is `es2022` — so this
costs no bundler configuration and no wrapper function, and nothing else in the file
changes. `main` remains the only file that awaits anything.

The rejection path is caught rather than propagated: `.catch(() => new Map())`. An
uncaught rejection in a top-level `await` aborts module evaluation, so the frame loop would
never start and the page would stay blank — the worst possible outcome for a missing
decorative asset. Falling back to an empty map instead makes every `textures.get(id) ?? null`
yield `null`, which is precisely the flat-colour path the phase already shipped and tested.
A failed download therefore costs surface detail and nothing else: the simulation, the
orbit lines, and the controls are unaffected.

Revised 2026-09-22, for 1C — the loop folds actions instead of taking `elapsedMs`:

```ts
const next = [{ kind: EActionKind.Tick, elapsedMs: elapsed }, ...drain()]
  .reduce(reducer, state);
```

The tick becomes an action like any other and the queue drains into the same fold. State is
still carried by closure and nothing is reassigned. Ordering inside the frame matters:
`update` moves the meshes, labels get their `visible` flag from `occluded`, then
`controls.enabled = next.focus === null`, `controls.update()`, and **`focus` last**, so the
tween is the final word on the camera; finally `renderer.render` and `labelRenderer.render`.

`main` also builds the label renderer and labels, registers the resize listener and calls it
once, and registers the pointer handlers. Click-versus-drag is resolved in `main`: a
`pointerdown` records the position, a `pointermove` beyond `DRAG_SLOP` pixels cancels the
click and pushes `Release` (so a drag always interrupts a flight), and only a `pointerup`
that never became a drag runs `pick`. A miss pushes nothing — a background click must not
yank the camera. A `wheel` also pushes `Release`.

`orbits(bodies, jd)` lives in `data/`, not in `main`. It keys a map by body id, skipping
the star, with `ellipse(body.orbit.elementsAt(jd), ORBIT_SEGMENTS)` for each. The filter on
the `kind` discriminant is what narrows `TBody` to `TOrbiter`, since `TStar` has no `orbit`;
this narrowing was verified under this project's TypeScript 7 with `--strict`, and again
after the move to `EBodyKind`. If a future version regresses it, the fallback is
`bodies.flatMap((body) => (body.kind === EBodyKind.Star ? [] : [body]))`, which infers
`TOrbiter[]` structurally. Sampling happens once at startup: the elements drift with the JPL
per-century rates, but over a century the drift is far below a pixel.

The loop carries state by closure: a function of `(state, previous)` returns the frame
callback, which computes elapsed = timestamp − previous (0 on the first frame), derives
`next = tick(state, elapsed)`, runs `update(handles, simulate(solar, next.jd))`,
`controls.update()`, and `renderer.render(scene, camera)`, then requests the next frame
with `(next, timestamp)`. Nothing is reassigned.

Hot reload: Vite's default full-page reload on edit. State-preserving reload via
`import.meta.hot` is the first item of 1B.

## 10. Errors

Three cases, all thrown at startup with a plain message: canvas element missing, WebGL
unavailable (three.js throws and it propagates), and a body id with no appearance entry.
There are no runtime network calls, so nothing is retried or degraded. `kepler` has
an iteration cap and the tests show it never reaches it.

## 11. Testing

### 11.1 Rules

- No mocks. No `vi.mock`, no `vi.fn`. Every function under test is pure and takes real
  inputs; the Horizons file is a recorded oracle, not a fake; scene tests construct real
  three.js objects, which need no GPU. `createRenderer`, `createControls`, and `resize`
  need a browser and are verified by running the app, not by unit tests. If a mock ever
  looks necessary, it is raised as a design question first.
- Every test fails when its code is broken or removed. Expected values never come from the
  code under test or its formula: they come from Horizons, a defining property, a
  hand-derived analytic case, or a textbook constant. No snapshot tests. Analytic cases
  are chosen so every term matters.
- Written first, watched red, then implemented. After the suite is green, a manual
  mutation pass breaks each function once, confirms its test goes red, and the result is
  reported before 1A is called done.
- Clean: one behaviour per test, named as a claim; no `beforeEach`, no shared mutable
  state; helpers limited to small builders for synthetic bodies; exact equality except
  computed physics, where `toBeCloseTo` carries an explicit precision.

### 11.2 Runner

Vitest, configured in the `test` block of `vite.config.ts`, environment `node`, including
`src/**/*.test.ts`. Tests are colocated with the file they test, named `<filename>.test.ts`,
in the same folder — not mirrored under `test/`. `test/` holds only `fixtures/`.
`tsconfig.json` `include` gains `scripts`. Scripts: `"test": "vitest run"`,
`"fixtures": "node scripts/horizons.ts"`.

### 11.3 Fixtures

`scripts/horizons.ts` is a standalone Node script with no imports from `src/`, using only
syntax Node's built-in type stripping accepts. Run once, it queries the Horizons API for
Sun-centred (`CENTER='500@10'`) ecliptic vectors in AU for Horizons bodies 1 through 8,
the planetary barycentres, at six dates: 2000-01-01 12:00 UTC (J2000) and, at 00:00 UTC, 2026-09-18,
2050-01-01, 1976-09-18, 2076-09-18, and 1600-01-01. It records the JD Horizons reports for each row,
so the fixture's time axis is Horizons's own. Output is `test/fixtures/horizons.json`,
committed, shaped as one entry per body id with the Horizons id, a `toleranceKm`, and the
samples. Tests never touch the network.

`toleranceKm` is set by hand after the first green run at twice the observed error per
planet. The observed error is planetary perturbation, real physics rather than slack; a
formula error produces errors thousands of times larger and cannot hide inside it.

### 11.4 Tests

- `src/simulator/propagate.test.ts` (validation): for every planet and sample, the
  distance between `propagate(body, jd)` and the Horizons vector is under `toleranceKm`,
  and the measured error in km is printed.
- `kepler`: residual M − (E − e·sin E) below 1e-12 over a grid of M in [−π, π] and e
  in [0, 0.99]; e = 0 gives E = M; M = 0 gives E = 0.
- `position`: circular orbit at zero inclination has radius a at every M; inclination π/2
  puts a quarter orbit entirely in z; non-zero Ω and ω each rotate a known point to a
  hand-derived answer.
- `elementsAt`: at T = 1 each element equals its J2000 value plus its rate, in radians;
  corrections are absent for the inner planets.
- `toPlanet`: kind, id, parent, and that `elementsAt(J2000)` matches `elementsAt(row, J2000)`.
- `simulate`: the sun is at the origin; a planet equals `propagate`; a synthetic moon around
  a synthetic planet lands at parent plus offset; an unknown parent throws.
- `ellipse` (added 2026-09-21): returns exactly `segments` points; a circular orbit keeps
  every point at radius a; every point of an eccentric orbit satisfies
  ((x + ae)/a)² + (y/b)² = 1; the first point is perihelion at a(1 − e) and the halfway
  point is aphelion at −a(1 + e); **the sweep is in eccentric anomaly, not mean anomaly**,
  pinned by four hand-derived vertices of the standard parametrisation at a = 1, e = 0.6,
  segments = 4 — an M-sweep puts point 1 at (−1.097, 0.694) instead of (−0.6, 0.8), so the
  test goes hard red with no threshold to tune (an e near Mercury's real 0.206 would be a
  poor choice: the two sweeps differ by only ~1.5× in spacing there, close enough to hide
  inside a loose tolerance); a zero-inclination orbit stays at z = 0 while an inclined one
  peaks at sin i; and the caller's elements come back unmutated.
- `createOrbitLines` (added 2026-09-21): returns a `LineLoop` — asserted as
  `instanceof LineLoop`, never `instanceof Line`, which would pass for a plain open `Line`
  and let the ring silently not close; the position attribute has `count === points.length`
  and `itemSize === 3`; vertex k equals `toScene(points[k])`, tying the geometry back to the
  one frame-change seam rather than a hand-copied vector; the material is a
  `LineBasicMaterial` carrying `ORBIT_COLOR`, `ORBIT_OPACITY`, `transparent` and
  `depthWrite: false`; an empty point list yields count 0 and does not throw. Colour is
  asserted with `material.color.getHex()`, not by bit-shifting into raw channels the way
  `backdrop` does: `backdrop` writes raw bytes itself, whereas a `LineBasicMaterial`
  converts sRGB→linear on ingest, so `color.r` reads 0.0578 where the bit-shifted byte
  would be 0.2667. `getHex()` converts back and round-trips the input exactly.
- `julian`: J2000 noon is 2451545.0; the Unix epoch is 2440587.5.
- `tick`, `initial`, `toScene`, `add`, `wrap`, `radians`: direct.
- Scene shape tests: `createPlanet` returns a mesh with a `MeshStandardMaterial` of the
  given colour and a radius derived from the appearance; `createStar` returns a mesh with a
  `MeshBasicMaterial` and a `PointLight` child; `createCamera` and `createScene` carry the
  constants; `update` lands each mesh at `toScene` of its position.

  Status 2026-09-21: of that bullet, only `update` is actually tested, alongside `toScene`
  and `createOrbitLines`. `createPlanet`, `createStar`, `createCamera`, and `createScene`
  have no test file. `createScene` is the one worth writing first: it now takes the body
  list and the orbit map as parameters, and builds a mesh per body, a line per orbit entry,
  and the lights, so nothing currently pins that assembly. This bullet described intent
  rather than fact and is recorded here as an open gap, not a claim.
- `orbits` (added 2026-09-21): no test yet. It is a filter and a map over `ellipse`, which
  is itself well covered, but the skip-the-star behaviour and the id keying are untested.
- Added 2026-09-22, for 1C. Every pure unit gets a colocated test; the three.js-touching
  files (`createLabels`, `createLabelRenderer`, `pick`, `focus`, `resize`) get none, because
  vitest runs in the `node` environment with no DOM. They were verified in the running app
  instead, and that is recorded as the reason rather than left as a silent gap.
  - `ease`: 0→0, 1→1, 0.5→0.5, symmetric about the midpoint, monotonic across a 51-point
    grid, slower than linear early, clamped outside [0,1].
  - `vantage`: standoff equals `radius × ZOOM_FACTOR`; the `MIN_APPROACH` floor holds for a
    tiny body; the camera sits sunward of the body; the planar bearing is offset from the
    planet–sun line by exactly `PHASE_ANGLE`; elevation lifts it above the ecliptic; at zero
    phase and elevation it lands exactly on the planet–sun line; it follows the sun direction
    rather than a fixed axis; rotation is about ecliptic up; a body at the sun falls back to
    a sunward default instead of dividing by zero; inputs come back unmutated.
  - `occluded`: hidden directly behind the sun; shown in front of it; shown beside it; shown
    when nearer the camera than the sun; shown on the far side of the camera from the sun;
    the sun is never occluded by itself; a body grazing the disc is hidden; the cone scales
    with the sun's radius **and widens with distance beyond it**; and a distant body just
    past the camera along the anti-sun direction is shown — the regression that the earlier
    "behind the camera" branch caused.
  - `queue`: empty drain returns `[]`; a pushed action comes back; order is preserved;
    drain empties; drain does not hand back a live view of the buffer.
  - `reducer`: every prior arithmetic case re-expressed as a `Tick` (assertions carried
    over verbatim), plus focus carried through a tick, focus set from the action without
    touching date or rate, a focus replaced while in flight, release clearing it, release
    harmless when nothing is focused, and a run of actions folded in order.
  - `initial`: starts with `focus: null`.

  Mutation pass (§11.1), 2026-09-22: 24 mutants across `ease`, `vantage`, `occluded`,
  `queue`, `reducer` and `initial`; 23 killed on the first run. The survivor was dropping
  the `along / sunDistance` factor from `occluded`'s cone — no test placed two bodies at
  different distances along the same ray. A widening-cone test was added and the mutant then
  died. All 24 killed after that.

## 12. Teaching split

**Step one is the owner's.** Before any of the layout exists, the owner writes the first
end-to-end slice in `main.ts` however they like: renderer, scene, camera, a lit sun, an
Earth mesh, and a frame loop, with Earth's position a stub circle at 1 AU driven by time.
The assistant guides in chat and answers three.js questions but writes none of it. It is
done when Earth visibly orbits a lit sun.

**Step two is the extraction.** The slice is refactored together into the layout in
section 3, one function per file, which is the lesson in why the layout is shaped as it
is. The stub circle is replaced by `simulate` once the simulator lands.

**Then the marked pieces.** The owner writes these three, each shipped as a file with the
signature and a body of `throw new Error("TODO(human)")`, with its test already red:

| Function | What it teaches |
|---|---|
| `kepler` | Newton–Raphson on Kepler's equation, the heart of the simulator |
| `tick` | a pure state transition, the pattern every tool will follow |
| `toScene` | the frame change from ecliptic-north-up to y-up |

`createCamera`, `createPlanet`, and the loop are the owner's from step one. The assistant
writes the rest and explains each three.js piece as it lands: controls, `update`,
`resize`, and whatever the extraction reshapes. Scaffolding shrinks in 1B.

## 13. Seams

- 1B: state-preserving hot reload first, then `data/sbdb/` with a bake script, a
  `toAsteroid` transformer whose `elementsAt` advances M₀ by mean motion from `GAUSSIAN_K`,
  `createAsteroids` returning one `Points` cloud, a `Float32Array` builder over
  `propagate`, and the per-kind appearance fallback.
- Phase 3 and 4 agent tools: a tool is a function from `State` to `State`; `update` gains a
  branch per new state field; `simulate` and `propagate` are the read tools as they stand.
  Whether the camera is derived from state or driven by one-shot directives is decided
  then, and both fit this shape.

  **Answered 2026-09-22 by 1C: the camera is derived from state.** `TState.focus` holds
  intent — target, start time, and the interpolation origin — and `scene/focus.ts` derives
  the camera position from it every frame. An agent tool is therefore an action pushed onto
  the same `state/queue.ts` that a label click pushes onto, and `reducer` folds both
  identically. Nothing about a tool call needs to know it did not come from a mouse.
- Phase 5 controls: the slider, date input, and rate control write `State` fields; the
  radius scale control replaces where `RADIUS_SCALE` is read.
- Moons: a source whose bodies have a planet id as `orbit.parent`. `simulate` already
  resolves it.

## 14. Package changes

Add `vitest` as a dev dependency. No runtime dependencies. Add the `test` and `fixtures`
scripts.

Revised 2026-09-21: `@types/node` is also a dev dependency. `scripts/horizons.ts` imports
`node:fs/promises`, and `scripts` is in the tsconfig `include`, so `pnpm check` needs the
Node types. `tsconfig.json` names them in `types` alongside `vite/client`. They are types
only, erased at compile time, and nothing shipped depends on them.

Revised 2026-09-22, for textures: still no dependencies, runtime or dev. `TextureLoader` is
part of `three`, which is already the one runtime dependency, so the nine body maps cost
code and bytes but nothing in `package.json`.

The bytes are an obligation rather than merely an asset. The textures are Solar System
Scope's, by INOVE, used under Creative Commons Attribution 4.0 International. CC BY 4.0
permits commercial use and redistribution but requires attribution wherever the work is
distributed — the creator, the title, the source, and the licence. `public/textures/CREDITS.md`
carries all four and ships alongside the images, so the obligation travels with the files
rather than living only in a commit message. This matters beyond tidiness: the project may
be sold, and an unattributed CC BY work is a licence breach, not a style lapse. Anything
that replaces these files must either carry its own attribution or be licensed such that
none is required.

## 15. Done means

- `pnpm check` clean, `pnpm test` green including the Horizons validation, `pnpm build`
  succeeds.
- The mutation pass is reported: each function broken once, its test red.
- `pnpm dev` shows the sun and eight planets orbiting at true distances, lit from the sun
  with dim (not black) night sides, against the graded indigo-to-violet backdrop, stable at
  every reachable camera distance (revised 2026-09-21; it was a black background), with
  drag-to-orbit and
  scroll-to-zoom.
- Eight faint grey-blue closed ellipses are visible (added 2026-09-21), nested and
  near-coplanar, each planet sitting *on* its own line and tracking along it as time
  advances — never drifting off it, which is what confirms the sampler and `propagate`
  agree. Mercury's ellipse is visibly off-centre from the sun, and zooming to its
  perihelion shows a smooth curve rather than facets. The lines do not wash out the planets
  or the backdrop at default zoom; `ORBIT_OPACITY` is the one number to turn if they do.
- Every tunable is in `src/constants/` and no file under `src/` contains a comment.
