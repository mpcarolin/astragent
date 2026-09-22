import type { TKeplerianElements } from "../types/elements";
import type { TVec3 } from "../types/vec3";

import { kepler } from "./kepler";

export function position(elements: TKeplerianElements): TVec3 {
  const {
    semiMajorAxis: a,
    eccentricity: e,
    inclination: i,
    ascendingNode: node,
    argumentOfPerihelion: peri,
  } = elements;

  const anomaly = kepler(elements.meanAnomaly, e);
  const xPlane = a * (Math.cos(anomaly) - e);
  const yPlane = a * Math.sqrt(1 - e * e) * Math.sin(anomaly);

  const cosPeri = Math.cos(peri);
  const sinPeri = Math.sin(peri);
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosInc = Math.cos(i);
  const sinInc = Math.sin(i);

  return {
    x:
      (cosPeri * cosNode - sinPeri * sinNode * cosInc) * xPlane +
      (-sinPeri * cosNode - cosPeri * sinNode * cosInc) * yPlane,
    y:
      (cosPeri * sinNode + sinPeri * cosNode * cosInc) * xPlane +
      (-sinPeri * sinNode + cosPeri * cosNode * cosInc) * yPlane,
    z: sinPeri * sinInc * xPlane + cosPeri * sinInc * yPlane,
  };
}
