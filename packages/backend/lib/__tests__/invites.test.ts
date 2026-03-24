import { describe, expect, it } from "vitest";

import {
  evaluateInvite,
  generateInviteToken,
  getInviteAcceptBlockedReason,
  getInvitePreviewReason,
  hashInviteToken,
  INVITE_TTL_MS,
} from "../invites";

describe("generateInviteToken", () => {
  it("returns a 64-char hex string", () => {
    const t = generateInviteToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("hashInviteToken", () => {
  it("is deterministic for the same input", async () => {
    const a = await hashInviteToken("hello");
    const b = await hashInviteToken("hello");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("evaluateInvite", () => {
  const future = 1_000_000_000_000;
  const past = 500_000_000_000;

  it("active when before expiry", () => {
    expect(
      evaluateInvite({
        status: "active",
        expiresAt: future,
        now: past,
      }),
    ).toEqual({ kind: "active", usable: true });
  });

  it("expired when now past expiresAt", () => {
    expect(
      evaluateInvite({
        status: "active",
        expiresAt: past,
        now: future,
      }),
    ).toEqual({ kind: "expired", usable: false });
  });

  it("revoked is never usable", () => {
    expect(
      evaluateInvite({
        status: "revoked",
        expiresAt: future,
        now: past,
      }),
    ).toEqual({ kind: "revoked", usable: false });
  });

  it("consumed is never usable", () => {
    expect(
      evaluateInvite({
        status: "consumed",
        expiresAt: future,
        now: past,
      }),
    ).toEqual({ kind: "consumed", usable: false });
  });
});

describe("getInviteAcceptBlockedReason", () => {
  const future = 2_000_000_000_000;
  const past = 1_000_000_000_000;

  it("ok for active invite and caller has no membership", () => {
    const evaluation = evaluateInvite({
      status: "active",
      expiresAt: future,
      now: past,
    });
    expect(
      getInviteAcceptBlockedReason({
        evaluation,
        callerHasAnyMembership: false,
        callerInTargetWorkspace: false,
      }),
    ).toBe("ok");
  });

  it("rejects expired", () => {
    const evaluation = evaluateInvite({
      status: "active",
      expiresAt: past,
      now: future,
    });
    expect(
      getInviteAcceptBlockedReason({
        evaluation,
        callerHasAnyMembership: false,
        callerInTargetWorkspace: false,
      }),
    ).toBe("expired");
  });

  it("rejects when already in another workspace", () => {
    const evaluation = evaluateInvite({
      status: "active",
      expiresAt: future,
      now: past,
    });
    expect(
      getInviteAcceptBlockedReason({
        evaluation,
        callerHasAnyMembership: true,
        callerInTargetWorkspace: false,
      }),
    ).toBe("already-in-another-workspace");
  });

  it("rejects when already member of target workspace", () => {
    const evaluation = evaluateInvite({
      status: "active",
      expiresAt: future,
      now: past,
    });
    expect(
      getInviteAcceptBlockedReason({
        evaluation,
        callerHasAnyMembership: true,
        callerInTargetWorkspace: true,
      }),
    ).toBe("already-member");
  });
});

describe("INVITE_TTL_MS", () => {
  it("is 7 days", () => {
    expect(INVITE_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("getInvitePreviewReason", () => {
  it("invalid-token when invite not found", () => {
    expect(
      getInvitePreviewReason({
        inviteFound: false,
        evaluation: { kind: "active", usable: true },
        callerHasAnyMembership: false,
        callerInTargetWorkspace: false,
      }),
    ).toBe("invalid-token");
  });
});
