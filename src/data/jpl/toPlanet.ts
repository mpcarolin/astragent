import type { TPlanet } from "../../types/body";
import type { TJplPlanet } from "./types";

import { elementsAt } from "./elementsAt";

export function toPlanet(row: TJplPlanet): TPlanet {
  return {
    kind: "planet",
    id: row.id,
    name: row.name,
    orbit: { parent: "sun", elementsAt: (jd: number) => elementsAt(row, jd) },
  };
}
