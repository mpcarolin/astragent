import type { TKeplerianElements } from "../../types/elements";
import type { TJplPlanet } from "./types";

import { DAYS_PER_CENTURY, J2000 } from "../../constants/astronomy";
import { radians } from "../../utils/radians";
import { wrap } from "../../utils/wrap";

export function elementsAt(row: TJplPlanet, jd: number): TKeplerianElements {
  const t = (jd - J2000) / DAYS_PER_CENTURY;

  const a = row.elements.a + row.rates.a * t;
  const e = row.elements.e + row.rates.e * t;
  const i = row.elements.i + row.rates.i * t;
  const l = row.elements.L + row.rates.L * t;
  const longPeri = row.elements.longPeri + row.rates.longPeri * t;
  const node = row.elements.node + row.rates.node * t;

  const { b = 0, c = 0, s = 0, f = 0 } = row.corrections ?? {};
  const ft = radians(f * t);
  const meanAnomaly = l - longPeri + b * t * t + c * Math.cos(ft) + s * Math.sin(ft);

  return {
    semiMajorAxis: a,
    eccentricity: e,
    inclination: radians(i),
    ascendingNode: radians(node),
    argumentOfPerihelion: radians(longPeri - node),
    meanAnomaly: wrap(radians(meanAnomaly)),
  };
}
