import { describe, expect, it, vi } from "vitest";

import { EquirectangularReflectionMapping } from "three";

import { backdrop } from "./backdrop";

vi.mock("./loadTexture", async () => {
  const { Texture } = await import("three");
  return {
    loadTexture: async (file: string) =>
      file === "missing.jpg" ? null : Object.assign(new Texture(), { name: file }),
  };
});

describe("backdrop", () => {
  it("loads the file it is given", async () => {
    expect((await backdrop("8k_stars.jpg"))?.name).toBe("8k_stars.jpg");
  });

  it("maps the texture as an equirectangular panorama", async () => {
    expect((await backdrop("8k_stars.jpg"))?.mapping).toBe(EquirectangularReflectionMapping);
  });

  it("returns null when the texture fails to load", async () => {
    expect(await backdrop("missing.jpg")).toBe(null);
  });
});
