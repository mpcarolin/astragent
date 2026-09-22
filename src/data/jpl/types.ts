export type TJplElements = {
  readonly a: number;
  readonly e: number;
  readonly i: number;
  readonly L: number;
  readonly longPeri: number;
  readonly node: number;
};

export type TJplCorrections = {
  readonly b: number;
  readonly c: number;
  readonly s: number;
  readonly f: number;
};

export type TJplPlanet = {
  readonly id: string;
  readonly name: string;
  readonly elements: TJplElements;
  readonly rates: TJplElements;
  readonly corrections?: TJplCorrections;
};
