import type { TOrbit } from "./orbit";

export enum EBodyKind {
  Star = "star",
  Planet = "planet",
  Moon = "moon",
  Asteroid = "asteroid",
}

export type TBaseBody = {
  readonly id: string;
  readonly name: string;
};

export type TStar = TBaseBody & {
  readonly kind: EBodyKind.Star;
};

export type TOrbitingBody = TBaseBody & {
  readonly orbit: TOrbit;
};

export type TPlanet = TOrbitingBody & {
  readonly kind: EBodyKind.Planet;
};

export type TMoon = TOrbitingBody & {
  readonly kind: EBodyKind.Moon;
};

export type TAsteroid = TOrbitingBody & {
  readonly kind: EBodyKind.Asteroid;
};

export type TOrbiter = TPlanet | TMoon | TAsteroid;

export type TBody = TStar | TOrbiter;
