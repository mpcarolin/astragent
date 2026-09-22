import { mkdir, writeFile } from "node:fs/promises";

type TResponse = {
  readonly result?: string;
  readonly error?: string;
};

type TTarget = {
  readonly id: string;
  readonly horizons: string;
};

type TSample = {
  readonly jd: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

type TEntry = {
  readonly horizons: string;
  readonly toleranceKm: number;
  readonly samples: readonly TSample[];
};

type TFixture = Record<string, TEntry>;

const API = "https://ssd.jpl.nasa.gov/api/horizons.api";

const TARGETS: readonly TTarget[] = [
  { id: "mercury", horizons: "1" },
  { id: "venus", horizons: "2" },
  { id: "earth", horizons: "3" },
  { id: "mars", horizons: "4" },
  { id: "jupiter", horizons: "5" },
  { id: "saturn", horizons: "6" },
  { id: "uranus", horizons: "7" },
  { id: "neptune", horizons: "8" },
];

const DATES: readonly string[] = [
  "2000-01-01T12:00:00Z",
  "2026-09-18T00:00:00Z",
  "2050-01-01T00:00:00Z",
  "1976-09-18T00:00:00Z",
  "2076-09-18T00:00:00Z",
  "1600-01-01T00:00:00Z",
];

const UNIX_EPOCH_JD = 2440587.5;
const MS_PER_DAY = 86400000;
const PLACEHOLDER_TOLERANCE_KM = 1000000;

function julian(iso: string): number {
  return new Date(iso).getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}

function query(target: TTarget, jds: readonly number[]): string {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${target.horizons}'`,
    EPHEM_TYPE: "VECTORS",
    CENTER: "'500@10'",
    REF_PLANE: "ECLIPTIC",
    VEC_TABLE: "1",
    OUT_UNITS: "AU-D",
    OBJ_DATA: "NO",
    CSV_FORMAT: "YES",
    TLIST_TYPE: "JD",
    TLIST: jds.map((jd) => jd.toFixed(6)).join(" "),
  });
  return `${API}?${params.toString()}`;
}

function block(result: string): string {
  const start = result.indexOf("$$SOE");
  const end = result.indexOf("$$EOE");
  if (start < 0 || end < 0) throw new Error(`no $$SOE/$$EOE block:\n${result.slice(0, 2000)}`);
  return result.slice(start + "$$SOE".length, end);
}

function parse(result: string): readonly TSample[] {
  const rows = block(result)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return rows.map((row) => {
    const fields = row.split(",").map((field) => field.trim());
    const [jd, , x, y, z] = fields;
    if (jd === undefined || x === undefined || y === undefined || z === undefined) {
      throw new Error(`unparseable row: ${row}`);
    }
    const sample: TSample = {
      jd: Number(jd),
      x: Number(x),
      y: Number(y),
      z: Number(z),
    };
    if (![sample.jd, sample.x, sample.y, sample.z].every(Number.isFinite)) {
      throw new Error(`non-numeric row: ${row}`);
    }
    return sample;
  });
}

async function fetchTarget(target: TTarget, jds: readonly number[]): Promise<readonly TSample[]> {
  const response = await fetch(query(target, jds));
  if (!response.ok) throw new Error(`${target.id}: HTTP ${response.status}`);
  const payload = (await response.json()) as TResponse;
  if (payload.error) throw new Error(`${target.id}: ${payload.error}`);
  if (!payload.result) throw new Error(`${target.id}: no result field`);
  const samples = parse(payload.result);
  if (samples.length !== jds.length) {
    throw new Error(`${target.id}: expected ${jds.length} rows, got ${samples.length}`);
  }
  return samples;
}

async function main(): Promise<void> {
  const jds = DATES.map(julian);
  const fixture: TFixture = {};

  for (const target of TARGETS) {
    const samples = await fetchTarget(target, jds);
    fixture[target.id] = {
      horizons: target.horizons,
      toleranceKm: PLACEHOLDER_TOLERANCE_KM,
      samples,
    };
    const first = samples[0];
    if (!first) throw new Error(`${target.id}: no samples`);
    console.log(
      `${target.id.padEnd(8)} ${samples.length} samples, jd ${first.jd} -> ` +
        `(${first.x}, ${first.y}, ${first.z})`,
    );
  }

  const dir = new URL("../test/fixtures/", import.meta.url);
  const out = new URL("horizons.json", dir);
  await mkdir(dir, { recursive: true });
  await writeFile(out, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
  console.log(`wrote ${out.pathname}`);
}

await main();
