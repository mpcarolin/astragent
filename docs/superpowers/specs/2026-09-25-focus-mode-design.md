# Focus mode: follow, orbit, describe, detach

Date: 2026-09-25. Status: design approved in conversation (brainstormed 2026-09-25).
Builds on `2026-09-18-phase-1a-planets-design.md` (§8 focus, §9 loop).

**Amended 2026-09-25, after implementation:** the overview and "focused on the Sun" are now
two states. `targetId: null` is the overview, which shows no bubble. The Sun is an ordinary
body, with its own vantage, bubble, and ×. §1, §2, §3, §4, §5, §6, §7, and §8 are rewritten
in place to match.

**Amended 2026-09-26:** `scene/reveal.ts` is renamed `scene/updateLabels.ts`, the single
per-frame label call. It finds the star in `located` itself, so `main.ts` no longer derives
`starId`. The §5 loop order is updated to match.

**Amended 2026-09-26, later:** the name labels and the bubble are one category, `TLabels`
(`names` and `bubble`, in `types/handles.ts`). `createLabels` builds both through
`createNames` and `createBubble`. `updateLabels` runs both through `hideOccluded` and
`placeBubble`, once per frame after `focus`. `main.ts` has one label call to create and one
to update. Functions with four or more parameters now take a single object parameter
(a new CLAUDE.md rule). `focus` and `focusAction` gained unit tests. §5, §6, and §8 are
updated to match.

This resolves the 1A spec's known limitation **"focus frames the planet at landing, then
lets it drift"**: focus is now sticky. The camera follows the focused body along its orbit
until the user focuses something else.

## 1. Before and wanted

Before: focusing a body flies the camera to a vantage point beside it, **stops the clock**
(the reducer's Focus arm set `rate: 0`), and **disables OrbitControls**
(`controls.enabled = next.focus === null`). A drag past the slop or any wheel event released
focus and restarted the clock at `INITIAL_RATE`. Nothing described what you were looking
at, and focusing the Sun (key `0`) landed about 47 scene units off the Sun at an angle, not
at the opening overview `(0, 150, 0)`.

Wanted:

1. Focusing no longer stops time.
2. OrbitControls orbit the focused body and follow it along its orbit.
3. A short description bubble sits beside the body, never in front of it.
4. An × on any bubble, or Escape, detaches and flies back to the opening overview, where no
   bubble shows.

## 2. Decisions

- **The overview is home, and has no bubble.** It is `focus.targetId === null`. × on any
  bubble, and Escape, fly to `START_POSITION` relative to the Sun and orbit the Sun there.
  The bubble is hidden for the whole flight home and stays hidden.
- **The Sun is an ordinary body.** A click on it, or key `0`, flies to its vantage like any
  planet, and its bubble has a × like any other.
- The app **launches at the overview, already landed**, so no bubble shows at start.
- The focus itself is therefore **never null**. Only its `targetId` is. `Release`,
  wheel-release, and drag-release are gone.
- Drag and wheel orbit and zoom around the focused body. Pan is disabled: a pan would move
  the target off the body, and the follow step would yank it back every frame.
- Detaching never touches `rate`, so a spacebar pause survives focus changes.
- Follow is a **per-frame translate** of the camera and `controls.target` by the body's
  movement.
- The bubble is a **`CSS2DObject` at a 3D anchor**: `body + cameraRight × extent × gap`.
- The assistant implements every piece. The §12 teaching split of the 1A spec does not
  apply here, at the owner's request.

## 3. State and actions

- `TState.focus: TFocus`. It is never null. `TFocus.targetId` widens to `string | null`, and
  `null` means the overview. The flight fields are unchanged, so flying home is still a
  flight.
- `EActionKind.FocusRelease` and `TReleaseAction` are deleted.
- Reducer:
  - Focus arm: `{ ...state, focus }`. The rate is left alone.
  - PointerMove past the slop: `{ ...state, pointer: null }`. A drag no longer releases.
  - PointerUp and Tick: unchanged. A click that hits nothing keeps the current focus.
- `initial(now)` starts at the overview, already landed:
  `focus: { targetId: null, startedAt: -DURATION_MS, from: START_POSITION, fromTarget: origin }`.
  The flight "started" one full duration before the page clock's zero, so it counts as
  landed at every `performance.now() ≥ 0`. A finite negative start survives HMR's JSON
  round-trip, which `-Infinity` would not (it serialises as `null`).
- `hmr.ts`: `shift` no longer guards against a null focus.

## 4. Helpers

All pure, each with a colocated test.

| File | Signature | Returns |
|---|---|---|
| `utils/landed.ts` | `landed(focus, now)` | `now - focus.startedAt >= DURATION_MS` |
| `scene/extent.ts` | `extent(body, look)` | outermost visible radius in scene units: `STAR_RADIUS` for the star, `ringRadius(ring).outer` for a ringed body, otherwise `radius(radiusKm)` |
| `scene/overview.ts` | `overview(star)` | `toScene(star.position) + START_POSITION`, the opening overview relative to wherever the Sun is |
| `scene/destination.ts` | `destination(target, star, look)` | always the 1A vantage, `toScene(vantage(target, star, size / DISTANCE_SCALE))`, where `size` is `STAR_RADIUS` for the star and `radius(radiusKm)` otherwise. The Sun takes vantage's sunward fallback and lands `STAR_RADIUS × ZOOM_FACTOR` = 8 scene units out, lifted above the ecliptic. It uses the drawn `STAR_RADIUS`, not the Sun's `radiusKm`, which would put it about 37 units out |
| `scene/anchor.ts` | `anchor(center, orientation, distance)` | `center + (1,0,0)·orientation × distance`, with `center` left unmutated |
| `data/descriptions.ts` | `Record<string, string>` | one stable-facts sentence or two per body id; the name comes from `TBody.name` |

New constants: `ZOOM_FLOOR` in `constants/controls.ts`, and `BUBBLE_CLASS` and `BUBBLE_GAP`
in `constants/bubble.ts`.

## 5. Camera (`scene/focus.ts`)

Per frame, after `controls.update()`:

- Find the star, then the target: the star when `targetId` is null, otherwise the body with
  that id. Look up the target's appearance. The flight's endpoint is
  `dest = targetId === null ? overview(star) : destination(target, star, look)`. The follow
  and `minDistance` use the target either way, so the overview orbits and follows the Sun.
- `controls.minDistance = max(MIN_DISTANCE, extent(target.body, look) × ZOOM_FLOOR)`, so the
  wheel stops outside the body, or outside the rings for Saturn.
- **In flight** (not landed at both the loop's previous frame and now): lerp `camera.position`
  from `flight.from` to `dest` and `controls.target` from `flight.fromTarget` to the body,
  both by the eased progress (`k` clamped to 1), then `camera.lookAt(controls.target)`. This
  is the 1A flight. It runs through the frame that first lands — a stalled frame (a hidden
  tab, a long frame) that jumps past `DURATION_MS` still gets `k = 1`, snapping the camera
  exactly onto `dest` — because following instead would carry forward whatever mid-flight
  offset that gap left behind.
- **Landed** (landed at both the previous frame and now): `delta = body − controls.target`.
  Add it to both `camera.position` and `controls.target`. Orbiting about the old target and
  then translating both points is the same as translating and then orbiting, so the user's
  orbit, zoom, and damping carry through the follow.

`main.ts` sets `controls.enabled = landed(focus, timestamp)`. The loop order is `update`,
HUD, `controls.enabled`, `controls.update()`, `focus`, `updateLabels`, `renderer.render`,
`labelRenderer.render`. `updateLabels` runs after `focus` because the bubble's anchor reads
the camera's orientation, which `focus` sets. That also means occlusion is judged from this
frame's camera rather than the last one's.

**Amended during implementation (2026-09-25):** the plan set `minDistance` only in the
landed branch. That is a bug. `OrbitControls.update()` clamps the camera's distance to the
target every call, enabled or not, and it runs *before* `focus`. On the first landed frame
it would therefore clamp against the *previous* body's floor. Flying from the Sun (floor
1.5) to Earth (vantage distance about 0.34) would pop the camera out to 1.5 on landing. So
`focus` sets `minDistance` for the current target on every frame, in flight too. During the
flight that has no visible effect, because the lerp overwrites the camera afterwards.

## 6. Bubble

- `scene/createLabels.ts` returns `TLabels`: the per-body `names` from `createNames` and
  the `bubble` from `createBubble`. `scene/updateLabels.ts` hides occluded names
  (`hideOccluded`) and places the bubble (`placeBubble`).
- `scene/createBubble.ts` builds `<aside class="bubble">` holding an `<h2>`, a `<p>`, and a
  `<button type="button" aria-label="Back to overview">×</button>`. The button dispatches a
  focus on the overview (`targetId: null`). `center = (0, 0.5)`, so the bubble's left edge sits on the anchor, half
  above and half below. It starts hidden and is added to the **scene root**, not a mesh
  child, because meshes carry axial tilt.
- `scene/placeBubble.ts` (a mutation site) shows the bubble only when `targetId` is not null
  and the flight has landed, so never at the overview and never on the way there. When the
  focus changes body, it rewrites the heading and text. Every bubble has its ×, the Sun's
  included. Each frame it moves the bubble to
  `anchor(body, camera.quaternion, extent × BUBBLE_GAP)`.
- Only the × takes pointer input: `.bubble` is `pointer-events: none` and `.bubble button` is
  `pointer-events: auto`, so the bubble never blocks the labels or the canvas beneath it.
- Escape flies to the overview, same as ×.

**Amended during implementation (2026-09-25):** `BUBBLE_GAP` is 1.4, not the planned 1.3.
Seen from distance `d`, a sphere of radius `r` has an angular radius of `asin(r/d)`. The
anchor sits at `atan(g·r/d)`. The anchor clears the limb when `g ≥ d/√(d² − r²)`. The
tightest case is the zoom floor, `d = ZOOM_FLOOR·r = 1.5r`, which needs `g ≥ 1.342`. At 1.3,
the bubble's edge sits just inside the limb when fully zoomed in. The same bound covers
Saturn, because the rings lie inside a sphere of radius `extent`. The invariant is
`BUBBLE_GAP ≥ ZOOM_FLOOR / √(ZOOM_FLOOR² − 1)`.

## 7. Input

- Removed: the `wheel` listener that released focus.
- Added: Escape, on `keydown`, flies to the overview (`targetId: null`).
- Key `0` still maps to the Sun, so it now flies close to it, like any other digit.
- `TListeners` is unchanged.

## 8. Testing

Every new pure helper has a red-first colocated test. So do the reducer and `initial`
changes and the descriptions table, which is checked for a non-empty entry per body in
`solar`.

`focus`, `focusAction`, and `hideOccluded` are tested with real three.js objects: a
`PerspectiveCamera`, an `OrbitControls` built without a DOM element, `Mesh`, and `Object3D`.
None of them needs a DOM. The flight's start, ease, midpoint, stalled-frame snap, landed
follow, overview endpoint, and in-flight zoom floor all have tests.

`createNames`, `createBubble`, `placeBubble`, `pointerUp`, and the listeners have **no unit
tests**. Vitest runs in the `node` environment with no DOM, these files build or read DOM
elements, and the repo rules allow mocks only for I/O. They are checked in the running app
instead:

- launch shows the overview with no bubble
- a focus flies there while time keeps running, and the bubble, with its ×, appears to the
  right on landing
- a click on the Sun, or `0`, flies close to it (about 8 units) and shows its bubble with a ×
- a drag orbits the body and it stays centred
- the wheel stops outside the body, and outside Saturn's rings
- × or Escape flies to the overview, with no bubble during the flight or after it
- a pause survives focus changes
- right-drag does not pan
- HMR keeps following the focused body

## 9. Known limitations

Recorded, not built around:

- The bubble can clip at the right edge on a narrow screen or with a very large planet. It
  has no flip to the left.
- The bubble does not dodge other labels.
- Once landed, the camera's world-space offset from the body is fixed. As the body orbits,
  its lit side slowly turns away from the camera.
- The doc comment on `TState.focus` ("or null when the user has control") is the owner's and
  is now stale. It was flagged, not rewritten.
