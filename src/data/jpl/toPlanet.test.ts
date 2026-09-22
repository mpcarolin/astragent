
import { EBodyKind } from "../../types/body";
import { describe, expect, it } from "vitest";

import { J2000 } from "../../constants/astronomy";
import { elementsAt } from "./elementsAt";
import { planets } from "./planets";
import { toPlanet } from "./toPlanet";

describe("toPlanet", () => {
  it("returns a body of kind planet", () => {
    expect(toPlanet(planets[0]!).kind).toBe(EBodyKind.Planet);
  });

  it("carries the row's id and name", () => {
    const body = toPlanet(planets[0]!);
    expect(body.id).toBe("mercury");
    expect(body.name).toBe("Mercury");
  });

  it("orbits the sun", () => {
    expect(toPlanet(planets[0]!).orbit.parent).toBe("sun");
  });

  it("closes over the row so its elements match elementsAt", () => {
    const row = planets[4]!;
    expect(toPlanet(row).orbit.elementsAt(J2000)).toEqual(elementsAt(row, J2000));
  });

  it("evaluates the closure at the date it is given, not at build time", () => {
    const row = planets[2]!;
    const body = toPlanet(row);
    expect(body.orbit.elementsAt(J2000 + 36525)).toEqual(elementsAt(row, J2000 + 36525));
  });
});
