import type { TBody } from "../types/body";

import { planets } from "./jpl/planets";
import { toPlanet } from "./jpl/toPlanet";

export const solar: readonly TBody[] = [
  { kind: "star", id: "sun", name: "Sun" },
  ...planets.map(toPlanet),
];
