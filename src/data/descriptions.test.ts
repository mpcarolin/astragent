import { describe, expect, it } from "vitest";

import { descriptions } from "./descriptions";
import { solar } from "./solar";

describe("descriptions", () => {
  it("has a non-empty entry for every body in the solar system", () => {
    for (const body of solar) {
      expect(descriptions[body.id]).toBeTruthy();
    }
  });
});
