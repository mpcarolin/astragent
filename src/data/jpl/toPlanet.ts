import type { TPlanet } from "../../types/body";
import type { TJplPlanet } from "./types";

import { EBodyKind } from "../../types/body";

import { elementsAt } from "./elementsAt";

export function toPlanet(row: TJplPlanet): TPlanet {
  return {
    kind: EBodyKind.Planet,
    id: row.id,
    name: row.name,
    orbit: { parent: "sun", elementsAt: (jd: number) => elementsAt(row, jd) },
  };
}
