import type { TState } from "./types/state";

import { EActionKind } from "./types/action";
import { EBodyKind } from "./types/body";

import { createCamera } from "./scene/createCamera";
import { createControls } from "./scene/createControls";
import { createHud } from "./scene/createHud";
import { createLabelRenderer } from "./scene/createLabelRenderer";
import { createLabels } from "./scene/createLabels";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { focus } from "./scene/focus";
import { loadTextures } from "./scene/loadTextures";
import { reveal } from "./scene/reveal";
import { update } from "./scene/update";
import { registerListeners } from "./input/registerListeners";
import { orbits } from "./data/orbits";
import { solar } from "./data/solar";
import { simulate } from "./simulator/simulate";
import { initial } from "./state/initial";
import { drain } from "./state/queue";
import { reducer } from "./state/reducer";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) throw new Error("no #scene canvas");

const start = initial(new Date());

const textures = await loadTextures(solar.map((body) => body.id)).catch(
  () => new Map<string, never>(),
);

const camera = createCamera();
const updateHud = createHud(camera);
const renderer = createRenderer(canvas);
const labelRenderer = createLabelRenderer();
const controls = createControls(camera, canvas);
const starId = solar.find(({ kind }) => kind === EBodyKind.Star)?.id ?? "";
const { scene, bodies } = createScene(solar, orbits(solar, start.date), textures);
const labels = createLabels(solar, bodies, camera, controls);

registerListeners({ canvas, camera, controls, bodies, renderer, labelRenderer });

function loop(state: TState, previous: number) {
  return (timestamp: number) => {
    const elapsed = previous === 0 ? 0 : timestamp - previous;

    const next = drain().reduce(
      reducer,
      reducer(state, { kind: EActionKind.Tick, elapsedMs: elapsed }),
    );
    const located = simulate(solar, next.date);

    update(bodies, located);
    reveal(labels, bodies, starId, camera);

    updateHud();
    controls.enabled = next.focus === null;
    controls.update();
    focus(next, located, camera, controls, timestamp);
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);

    renderer.setAnimationLoop(loop(next, timestamp));
  };
}

renderer.setAnimationLoop(loop(start, 0));
