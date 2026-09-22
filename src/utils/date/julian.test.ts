import { describe, expect, it } from "vitest";

import { julian } from "./julian";

describe("julian", () => {
  it("maps the unix epoch to JD 2440587.5", () => {
    expect(julian(new Date("1970-01-01T00:00:00Z"))).toBe(2440587.5);
  });

  it("maps the J2000.0 epoch to JD 2451545.0", () => {
    expect(julian(new Date("2000-01-01T12:00:00Z"))).toBe(2451545);
  });

  it("accepts an ISO string", () => {
    expect(julian("2000-01-01T12:00:00Z")).toBe(2451545);
  });

  it("advances one julian day per calendar day", () => {
    expect(julian("2000-01-02T12:00:00Z") - julian("2000-01-01T12:00:00Z")).toBe(1);
  });
});
