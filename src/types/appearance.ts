export type TAppearance = {
  readonly color: number;
  readonly radiusKm: number;
  readonly texture: string;
  readonly ring?: TRingAppearance;
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
