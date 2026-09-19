# Phase 1A: planets orbiting the sun

Date: 2026-09-18. Status: design approved in conversation, awaiting written review.
Source of requirements: `goal.md`. Research: `research/`.

## 1. Scope

Phase 1A ends when `pnpm dev` shows the sun and the eight planets orbiting it at true
orbital distances, lit by the sun alone, with orbit controls, all running locally with no
network calls at runtime. Positions come from a pure simulator validated against JPL
Horizons.

Out of scope for 1A, each planned as a later addition that changes nothing designed here:
asteroids, moons, a starfield, orbit lines, labels, UI controls, deployment, and
state-preserving hot reload. Phase 1B begins with state-preserving hot reload, then adds
asteroids.

## 2. Conventions

- One exported function per file, and the file is named exactly after that function. Names
  are one word, two at most. Files under `types/`, `constants/`, `sources/jpl/planets.ts`,
  `sources/jpl/types.ts`, `sources/sun.ts`, and `scene/appearance.ts` hold data or types and
  are the only exceptions.
- No code comments. The one permitted marker is a thrown `Error("TODO(human)")` in a stub
  body, which is removed when the function is implemented.
- Functional style. Every function takes plain inputs and returns a value. The exceptions
  are the three.js mutation sites named in section 8 and the single `let` in `main.ts`.
- The simulator, types, state, utils, and sources never import three.js. A test enforces
  this.
- Every number that could be tuned lives in `src/constants/`, never inline.
- Angles are radians everywhere except inside `sources/jpl/`, where the table is kept in
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
    scale.ts              DISTANCE_SCALE, RADIUS_SCALE, STAR_RADIUS
    time.ts               DAYS_PER_SECOND, START_DATE (ISO string, or null for now)
  types/
    appearance.ts  body.ts  elements.ts  handles.ts  located.ts  orbit.ts  state.ts  vec3.ts
  utils/
    add.ts  julianDate.ts  radians.ts  wrap.ts
  sources/
    sun.ts                the star body constant
    jpl/
      types.ts            JplPlanet, the row as JPL publishes it
      planets.ts          Table 2a and 2b constants for the eight planets
      elementsAt.ts       the JPL evolution model
      toPlanet.ts         JplPlanet to Body
  simulator/
    solveKepler.ts  position.ts  propagate.ts  simulate.ts
  state/
    initial.ts  tick.ts
  scene/
    appearance.ts         colour and physical radius per body id
    createRenderer.ts  createCamera.ts  createControls.ts  createScene.ts
    createStar.ts  createPlanet.ts  toScene.ts  update.ts  resize.ts
scripts/
  horizons.ts             standalone Node script, writes the fixtures
test/
  fixtures/horizons.json
  boundary.test.ts
  <mirrors src/>          e.g. test/simulator/solveKepler.test.ts
docs/
  definitions.md
  superpowers/specs/
```

Dependency direction: `main` imports everything. `scene` imports `types`, `constants`,
`utils`. `simulator` imports `types`, `utils`. `sources` imports `types`, `utils`,
`constants/astronomy`. `state` imports `types`, `constants/time`. Nothing imports `main`.

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

type BodyKind = "star" | "planet" | "moon" | "asteroid"

type Body =
  | { readonly kind: "star"; readonly id: string; readonly name: string }
  | { readonly kind: "planet" | "moon" | "asteroid"; readonly id: string; readonly name: string; readonly orbit: Orbit }

type Located = { readonly body: Body; readonly position: Vec3 }

type State = { readonly jd: number; readonly daysPerSecond: number }

type Appearance = { readonly color: number; readonly radiusKm: number }

type Handles = {
  readonly renderer: WebGLRenderer
  readonly scene: Scene
  readonly camera: PerspectiveCamera
  readonly controls: OrbitControls
  readonly meshes: ReadonlyMap<string, Mesh>
}
```

The annotations above are for this document only; the source files carry none.
`handles.ts` uses `import type` from three.js, erased at compile time. Body ids are
`sun`, `mercury`, `venus`, `earth`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`.

`Orbit.elementsAt` is a closure built by the source's transformer. It is a record holding
a function, not an object with methods: no `this`, no mutation. It is the one shape every
source reduces to, and the simulator never learns which source produced it.

## 5. Sources

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

### 5.2 Sun

`sources/sun.ts` exports the constant `{ kind: "star", id: "sun", name: "Sun" }`.

## 6. Simulator

- `solveKepler(meanAnomaly, eccentricity)` wraps M to [−π, π], starts from
  E₀ = M + e·sin M, iterates Newton–Raphson ΔE = (M − (E − e·sin E)) / (1 − e·cos E) until
  |ΔE| < 1e-12 or fifty iterations, and returns E.
- `position(elements)` calls `solveKepler`, computes orbital-plane coordinates
  x′ = a(cos E − e), y′ = a√(1 − e²)·sin E, and rotates by Ω, i, ω into the parent's
  ecliptic frame:

  ```
  x = (cos ω cos Ω − sin ω sin Ω cos i)·x′ + (−sin ω cos Ω − cos ω sin Ω cos i)·y′
  y = (cos ω sin Ω + sin ω cos Ω cos i)·x′ + (−sin ω sin Ω + cos ω cos Ω cos i)·y′
  z = (sin ω sin i)·x′                     + (cos ω sin i)·y′
  ```

  Returns a `Vec3` with z toward ecliptic north.
- `propagate(body, jd)` returns the body's position relative to its parent: the origin for
  a star, otherwise `position(body.orbit.elementsAt(jd))`.
- `simulate(bodies, jd)` returns `readonly Located[]` in input order with absolute
  positions. A star is at the origin. An orbiting body is its parent's absolute position
  plus `propagate(body, jd)`, resolved recursively through the parent chain. A parent id
  not in the list throws. In 1A every parent is the sun, but the recursion is written and
  tested now so the type does not promise what the code cannot do.

### 6.1 Utilities

- `add(a, b)`: component-wise `Vec3` sum.
- `julianDate(value)`: `Date` or ISO string to Julian date, `ms / 86400000 + 2440587.5`.
  UTC is treated as ephemeris time; the difference is about a minute and moves Mercury by
  a few hundred kilometres.
- `radians(degrees)`.
- `wrap(angle)`: any angle to [−π, π].

## 7. State

`initial(now)` returns `{ jd: julianDate(START_DATE ?? now), daysPerSecond: DAYS_PER_SECOND }`.
`tick(state, elapsedMs)` returns a new state with `jd` advanced by
`daysPerSecond × elapsedMs / 1000`. These are the first of the transition functions that
agent tools will later be.

## 8. Scene

All scene functions build one three.js object from plain inputs and return it. The
mutation sites in the whole program are: `update`, `resize`, and the loop in `main.ts`
(which calls `controls.update()` and `renderer.render()`).

- `createRenderer(canvas)`: `WebGLRenderer` on the `#scene` canvas, antialias on, pixel
  ratio capped at 2, sized to the window. No logarithmic depth buffer.
- `createScene()`: `Scene` with background set to black.
- `createCamera()`: `PerspectiveCamera` from `constants/camera.ts`. Initial values:
  FOV 50, NEAR 0.01, FAR 500, START_POSITION in scene coordinates (AU, y-up) above the
  ecliptic, framing Neptune's orbit.
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
- `createPlanet(body, appearance)`: `Mesh` of `SphereGeometry` and `MeshStandardMaterial`
  with the appearance colour, roughness 1, metalness 0. Radius is
  `radiusKm / KM_PER_AU × RADIUS_SCALE`, linear. If no constant keeps both Mercury visible
  and Jupiter sane, the mapping gets its own function and goes sub-linear, decided after
  looking. `mesh.name` is the body id.
- `appearance.ts`: `Record<string, Appearance>` keyed by body id for the nine 1A bodies,
  colours chosen for recognisability, radii the NASA fact-sheet mean radii in km. A body
  with no entry is a startup error. 1B adds a per-kind fallback.
- `update(handles, located)`: for each located body, sets the named mesh's position from
  `toScene`.
- `resize(handles)`: sets renderer size and camera aspect, updates the projection matrix.

No ambient light. The night side of a planet is black by design.

The page: `index.html` keeps the `#scene` canvas; a small stylesheet makes it fill the
viewport with no margin on a black body, so nothing flashes before the first frame.

## 9. Startup and loop

`main.ts`, in order: find the canvas or throw; build renderer, scene, camera, controls;
build the body list as the sun plus `planets.map(toPlanet)`; build a mesh per body via
`createStar` or `createPlanet` and add each to the scene; assemble `Handles`; register
`() => resize(handles)` on the window's resize event and call it once; set
`state = initial(new Date())`; start the frame.

Each frame, given the animation timestamp: elapsed = timestamp − previous, or 0 on the
first frame;
`state = tick(state, elapsed)`; `update(handles, simulate(bodies, state.jd))`;
`controls.update()`; `renderer.render(scene, camera)`; request the next frame.

Hot reload: Vite's default full-page reload on edit. State-preserving reload via
`import.meta.hot` is the first item of 1B.

## 10. Errors

Three cases, all thrown at startup with a plain message: canvas element missing, WebGL
unavailable (three.js throws and it propagates), and a body id with no appearance entry.
There are no runtime network calls, so nothing is retried or degraded. `solveKepler` has
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
`test/**/*.test.ts`. `tsconfig.json` `include` gains `test` and `scripts`. Scripts:
`"test": "vitest run"`, `"fixtures": "node scripts/horizons.ts"`.

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

- `test/simulator/propagate.test.ts` (validation): for every planet and sample, the
  distance between `propagate(body, jd)` and the Horizons vector is under `toleranceKm`,
  and the measured error in km is printed.
- `solveKepler`: residual M − (E − e·sin E) below 1e-12 over a grid of M in [−π, π] and e
  in [0, 0.99]; e = 0 gives E = M; M = 0 gives E = 0.
- `position`: circular orbit at zero inclination has radius a at every M; inclination π/2
  puts a quarter orbit entirely in z; non-zero Ω and ω each rotate a known point to a
  hand-derived answer.
- `elementsAt`: at T = 1 each element equals its J2000 value plus its rate, in radians;
  corrections are absent for the inner planets.
- `toPlanet`: kind, id, parent, and that `elementsAt(J2000)` matches `elementsAt(row, J2000)`.
- `simulate`: the sun is at the origin; a planet equals `propagate`; a synthetic moon around
  a synthetic planet lands at parent plus offset; an unknown parent throws.
- `julianDate`: J2000 noon is 2451545.0; the Unix epoch is 2440587.5.
- `tick`, `initial`, `toScene`, `add`, `wrap`, `radians`: direct.
- Scene shape tests: `createPlanet` returns a mesh with a `MeshStandardMaterial` of the
  given colour and a radius derived from the appearance; `createStar` returns a mesh with a
  `MeshBasicMaterial` and a `PointLight` child; `createCamera` and `createScene` carry the
  constants; `update` lands each mesh at `toScene` of its position.
- `boundary.test.ts`: reads every file under `simulator/`, `state/`, `utils/`, `sources/`,
  and `types/` except `handles.ts`, and fails if any imports from `three`.

## 12. Teaching split

The owner writes these six, each shipped as a file with the signature and a body of
`throw new Error("TODO(human)")`, with its test already red:

| Function | What it teaches |
|---|---|
| `solveKepler` | Newton–Raphson on Kepler's equation, the heart of the simulator |
| `tick` | a pure state transition, the pattern every tool will follow |
| `createCamera` | projection parameters and why near and far matter in AU |
| `createPlanet` | geometry, material, mesh: the core three.js mental model |
| `toScene` | the frame change from ecliptic-north-up to y-up |
| the frame loop in `main.ts` | `requestAnimationFrame`, elapsed time, the render call |

The assistant writes the rest and explains each three.js piece as it lands: renderer,
controls, star and light, `update`, `resize`. Scaffolding shrinks in 1B.

## 13. Seams

- 1B: state-preserving hot reload first, then `sources/sbdb/` with a bake script, a
  `toAsteroid` transformer whose `elementsAt` advances M₀ by mean motion from `GAUSSIAN_K`,
  `createAsteroids` returning one `Points` cloud, a `Float32Array` builder over
  `propagate`, and the per-kind appearance fallback.
- Phase 3 and 4 agent tools: a tool is a function from `State` to `State`; `update` gains a
  branch per new state field; `simulate` and `propagate` are the read tools as they stand.
  Whether the camera is derived from state or driven by one-shot directives is decided
  then, and both fit this shape.
- Phase 5 controls: the slider, date input, and rate control write `State` fields; the
  radius scale control replaces where `RADIUS_SCALE` is read.
- Moons: a source whose bodies have a planet id as `orbit.parent`. `simulate` already
  resolves it.

## 14. Package changes

Add `vitest` as a dev dependency. No other dependencies. Add the `test` and `fixtures`
scripts.

## 15. Done means

- `pnpm check` clean, `pnpm test` green including the Horizons validation, `pnpm build`
  succeeds.
- The mutation pass is reported: each function broken once, its test red.
- `pnpm dev` shows the sun and eight planets orbiting at true distances, lit from the sun
  with dark night sides, on a black background, with drag-to-orbit and scroll-to-zoom.
- Every tunable is in `src/constants/` and no file under `src/` contains a comment.
