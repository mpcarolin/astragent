import { describe, expect, it } from "vitest";

import { solar } from "../data/solar";
import { appearance } from "./appearance";

describe("appearance", () => {
  it("has an entry for every body in the solar system", () => {
    solar.forEach((body) => {
      expect(appearance[body.id]).toBeDefined();
    });
  });

  it("names a texture file for every body in the solar system", () => {
    solar.forEach((body) => {
      expect(appearance[body.id]?.texture).toMatch(/\.jpg$/);
    });
  });

  it("names a texture file in every entry it holds", () => {
    Object.values(appearance).forEach((look) => {
      expect(look.texture).toMatch(/\.jpg$/);
    });
  });

  it("gives each body its own texture file", () => {
    const files = Object.values(appearance).map((look) => look.texture);
    expect(new Set(files).size).toBe(files.length);
  });
});
