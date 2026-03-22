import { describe, expect, it } from "vitest";

import { normalizeNameToSlugBase, pickUniqueSlug } from "../slugs";

describe("normalizeNameToSlugBase", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(normalizeNameToSlugBase("My Team Name")).toBe("my-team-name");
  });

  it("strips punctuation", () => {
    expect(normalizeNameToSlugBase("Foo & Bar!!!")).toBe("foo-bar");
  });

  it("uses fallback when name is empty after normalization", () => {
    expect(normalizeNameToSlugBase("   !!!   ")).toBe("workspace");
  });
});

describe("pickUniqueSlug", () => {
  it("returns base when not taken", () => {
    expect(pickUniqueSlug("acme", new Set())).toBe("acme");
  });

  it("appends -2 when base is taken", () => {
    expect(pickUniqueSlug("acme", new Set(["acme"]))).toBe("acme-2");
  });

  it("increments until a free slug is found", () => {
    const taken = new Set(["acme", "acme-2", "acme-3"]);
    expect(pickUniqueSlug("acme", taken)).toBe("acme-4");
  });

  it("uses workspace fallback for empty base", () => {
    expect(pickUniqueSlug("", new Set())).toBe("workspace");
  });
});
