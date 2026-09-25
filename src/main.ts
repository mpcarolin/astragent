import type { TState } from "./types/state";

import { EActionKind } from "./types/action";
import { EBodyKind } from "./types/body";

import { createCamera } from "./scene/createCamera";
import { createControls } from "./scene/createControls";
import { createLabelRenderer } from "./scene/createLabelRenderer";
import { createLabels } from "./scene/createLabels";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { focus } from "./scene/focus";
import { hmr } from "./scene/hmr";
import { reveal } from "./scene/reveal";
import { update } from "./scene/update";
import { updateHud } from "./scene/updateHud";
import { registerListeners } from "./input/registerListeners";
import { orbits } from "./data/orbits";
import { solar } from "./data/solar";
import { simulate } from "./simulator/simulate";
import { initial } from "./state/initial";
import { drainActionQueue } from "./state/queue";
import { reducer } from "./state/reducer";

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
const starId = solar.find(({ kind }) => kind === EBodyKind.Star)?.id ?? "";
const { scene, bodies } = await createScene(solar, orbits(solar, initialState.date));
const labels = createLabels(solar, bodies, camera, controls);

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

    update(bodies, located);
    reveal(labels, bodies, starId, camera);

    if (hud) {
      updateHud(hud, camera, state);
    }

    controls.enabled = next.focus === null;
    controls.update();
    focus(next, located, camera, controls, timestamp);
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);

    renderer.setAnimationLoop(loop(next, timestamp));
  };
}

renderer.setAnimationLoop(loop(initialState, 0));
