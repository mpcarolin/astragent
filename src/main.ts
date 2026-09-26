import type { TState } from "./types/state";

import { EActionKind } from "./types/action";

import { hmr } from "./scene/hmr";
import { animateFocus } from "./scene/animateFocus";
import { createCamera } from "./scene/createCamera";
import { createControls } from "./scene/createControls";
import { createLabelRenderer } from "./scene/createLabelRenderer";
import { createLabels } from "./scene/createLabels";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { updateBodies } from "./scene/updateBodies";
import { updateHud } from "./scene/updateHud";
import { updateLabels } from "./scene/updateLabels";
import { registerListeners } from "./input/registerListeners";
import { orbits } from "./data/orbits";
import { solar } from "./data/solar";
import { simulate } from "./simulator/simulate";
import { initial } from "./state/initial";
import { drainActionQueue } from "./state/queue";
import { reducer } from "./state/reducer";
import { isFocusComplete } from "./utils/isFocusComplete";

const hud = document.querySelector<HTMLElement>("#hud");

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) {
  throw new Error("no #scene canvas");
}

const initialState = initial(new Date());

const camera = createCamera();
const renderer = createRenderer(canvas);
const labelRenderer = createLabelRenderer();
const controls = createControls(camera, canvas);
const { scene, bodies } = await createScene(solar, orbits(solar, initialState.date));
const labels = createLabels({ scene, bodies: solar, meshes: bodies, camera, controls });

registerListeners({ canvas, camera, controls, bodies, renderer, labelRenderer });

function loop(state: TState, previous: number) {
  return (timestamp: number) => {
    const elapsed = previous === 0 ? 0 : timestamp - previous;

    const actions = drainActionQueue()

    const next = hmr(
      actions.reduce(
        reducer,
        reducer(state, { kind: EActionKind.Tick, elapsedMs: elapsed })
      ),
      camera,
      controls,
    );
    const located = simulate(solar, next);

    updateLabels({
      labels,
      state: next,
      located,
      meshes: bodies,
      camera,
      now: timestamp
    });
    updateBodies(bodies, located);
    if (hud) {
      updateHud(hud, camera, state);
    }

    controls.enabled = isFocusComplete(next.focus, timestamp);
    controls.update();

    animateFocus({
      state: next,
      located, camera,
      controls,
      now: timestamp,
      previous
    });

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);

    renderer.setAnimationLoop(loop(next, timestamp));
  };
}

renderer.setAnimationLoop(loop(initialState, 0));
