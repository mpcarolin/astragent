import { MAX_DISTANCE } from "./controls";
import { SCENE_RADIUS } from "./scale";

export const FOV = 50;
export const NEAR = 0.01;
export const FAR = MAX_DISTANCE + SCENE_RADIUS;
export const START_POSITION = { x: 0, y: 1, z: 150 } as const;
