import type { TLocated } from "../types/located";

import { describe, expect, it } from "vitest";
import { Vector3 } from "three";

import { START_POSITION } from "../constants/camera";
import { solar } from "../data/solar";
import { overview } from "./overview";
import { toScene } from "./toScene";

const sun = () => {
  const body = solar.find((candidate) => candidate.id === "sun");
  if (!body) {
    throw new Error("no body for sun");
  }
  return body;
};

describe("overview", () => {
  it("sits at the opening overview position for a sun at the origin", () => {
    const star: TLocated = { body: sun(), position: { x: 0, y: 0, z: 0 } };
    expect(
      overview(star).equals(new Vector3(START_POSITION.x, START_POSITION.y, START_POSITION.z)),
    ).toBe(true);
  });

  it("keeps the overview relative to wherever the sun is", () => {
    const star: TLocated = { body: sun(), position: { x: 12, y: -4, z: 7 } };
    const expected = toScene(star.position).add(START_POSITION);
    expect(overview(star).equals(expected)).toBe(true);
  });

  it("does not mutate the sun or the shared start position", () => {
    const star: TLocated = { body: sun(), position: { x: 12, y: -4, z: 7 } };
    const startBefore = { ...START_POSITION };

    overview(star);

    expect(START_POSITION).toEqual(startBefore);
    expect(star.position).toEqual({ x: 12, y: -4, z: 7 });
  });
});
