// https://en.wikipedia.org/wiki/Newton's_method
export function newtonRaphson(f: (x: number) => number, fPrime: (x: number) => number, x0: number): number {
  let x = x0;

  for (let i = 0; i < 50; i++) {
    const delta = f(x) / fPrime(x);
    x -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }

  return x;
}
