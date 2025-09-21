import { describe, it, expect } from "vitest";
import { unreplaceWithPlaceholders } from "../replaceUtil";
import { isPlainUtterance } from "@/classification/utteranceUtil";

describe("replaceUtil", () => {
  describe("unreplaceWithPlaceholders", () => {
    it("returns original when no unreplacements", () => {
      const s = "hello world";
      const out = unreplaceWithPlaceholders(s);
      expect(out).toBe(s);
    });

    it("applies an ITEMS unreplacement", () => {
      const s = "i have ITEMS";
      const out = unreplaceWithPlaceholders(s);
      expect(isPlainUtterance(out)).toBe(true);
    });

    it("applies a NUMBER unreplacement", () => {
      const s = "i have NUMBER apples";
      const out = unreplaceWithPlaceholders(s);
      expect(isPlainUtterance(out)).toBe(true);
    });

    it("applies multiple unreplacements", () => {
      const s = "i have ITEMS and NUMBER oranges";
      const out = unreplaceWithPlaceholders(s);
      expect(isPlainUtterance(out)).toBe(true);
    });
  });
});