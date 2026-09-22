import type { TOrbit } from "./orbit";

export type TBodyKind = "star" | "planet" | "moon" | "asteroid";

export type TBaseBody = {
  readonly id: string;
  readonly name: string;
};

export type TStar = TBaseBody & {
  readonly kind: "star";
};

export type TOrbitingBody = TBaseBody & {
  readonly orbit: TOrbit;
};

export type TPlanet = TOrbitingBody & {
  readonly kind: "planet";
};

export type TMoon = TOrbitingBody & {
  readonly kind: "moon";
};

export type TAsteroid = TOrbitingBody & {
  readonly kind: "asteroid";
};

export type TOrbiter = TPlanet | TMoon | TAsteroid;

export type TBody = TStar | TOrbiter;
