import type { TVec3 } from "./vec3";

export type TAppearance = {
  readonly color: number;
  readonly radiusKm: number;
  readonly texture: string;
  readonly ring?: TRingAppearance;
  readonly pole?: TVec3;
};

export type TRingAppearance = {
  readonly color: number;
  readonly innerRadiusKm: number;
  readonly outerRadiusKm: number;
  readonly texture?: string;
}

export type TRingRadius = {
  readonly inner: number;
  readonly outer: number;
};
