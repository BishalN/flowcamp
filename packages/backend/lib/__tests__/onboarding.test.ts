import { describe, expect, it } from "vitest";

import { deriveBootstrapFlags } from "../onboarding";

describe("deriveBootstrapFlags", () => {
  it("signed-in but no app record", () => {
    expect(deriveBootstrapFlags({ hasAppUser: false, hasMembership: false })).toEqual({
      needsUserRecord: true,
      needsWorkspaceCreation: false,
      canAcceptInvite: false,
    });
  });

  it("user record but no workspace", () => {
    expect(deriveBootstrapFlags({ hasAppUser: true, hasMembership: false })).toEqual({
      needsUserRecord: false,
      needsWorkspaceCreation: true,
      canAcceptInvite: true,
    });
  });

  it("user with membership (owner or member)", () => {
    expect(deriveBootstrapFlags({ hasAppUser: true, hasMembership: true })).toEqual({
      needsUserRecord: false,
      needsWorkspaceCreation: false,
      canAcceptInvite: false,
    });
  });
});
