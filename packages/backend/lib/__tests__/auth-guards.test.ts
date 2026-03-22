import { describe, expect, it } from "vitest";

import { canCreateFirstWorkspace, canManageInvites, canReadWorkspace } from "../authGuards";

describe("canReadWorkspace", () => {
  it("blocks non-member", () => {
    expect(canReadWorkspace(null)).toBe(false);
  });

  it("allows member", () => {
    expect(canReadWorkspace("member")).toBe(true);
  });

  it("allows owner", () => {
    expect(canReadWorkspace("owner")).toBe(true);
  });
});

describe("canManageInvites", () => {
  it("only owner can manage invites", () => {
    expect(canManageInvites(null)).toBe(false);
    expect(canManageInvites("member")).toBe(false);
    expect(canManageInvites("owner")).toBe(true);
  });
});

describe("canCreateFirstWorkspace", () => {
  it("rejects when already in a workspace", () => {
    expect(canCreateFirstWorkspace(true)).toBe(false);
  });

  it("allows when no membership", () => {
    expect(canCreateFirstWorkspace(false)).toBe(true);
  });
});
