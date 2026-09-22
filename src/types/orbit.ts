import type { TKeplerianElements } from "./elements";

export type TOrbit = {
  readonly parent: string;
  readonly elementsAt: (jd: number) => TKeplerianElements;
};
