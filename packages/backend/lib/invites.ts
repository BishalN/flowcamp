/** Default invite link lifetime (7 days), in milliseconds. */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteRecordStatus = "active" | "revoked" | "consumed";

export type InviteEvaluation =
  | { kind: "active"; usable: true }
  | { kind: "expired"; usable: false }
  | { kind: "revoked"; usable: false }
  | { kind: "consumed"; usable: false };

/**
 * Random raw token for invite URLs (hex string).
 */
export function generateInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Store-only hash of the raw token (SHA-256 hex).
 */
export async function hashInviteToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function evaluateInvite(args: {
  status: InviteRecordStatus;
  expiresAt: number;
  now: number;
}): InviteEvaluation {
  if (args.status === "revoked") {
    return { kind: "revoked", usable: false };
  }
  if (args.status === "consumed") {
    return { kind: "consumed", usable: false };
  }
  if (args.now > args.expiresAt) {
    return { kind: "expired", usable: false };
  }
  return { kind: "active", usable: true };
}

export type InvitePreviewReason =
  | "ok"
  | "expired"
  | "revoked"
  | "consumed"
  | "invalid-token"
  | "already-member"
  | "already-in-another-workspace";

export function getInviteAcceptBlockedReason(args: {
  evaluation: InviteEvaluation;
  callerHasAnyMembership: boolean;
  callerInTargetWorkspace: boolean;
}): InvitePreviewReason {
  if (!args.evaluation.usable) {
    if (args.evaluation.kind === "expired") {
      return "expired";
    }
    if (args.evaluation.kind === "revoked") {
      return "revoked";
    }
    return "consumed";
  }
  if (args.callerInTargetWorkspace) {
    return "already-member";
  }
  if (args.callerHasAnyMembership) {
    return "already-in-another-workspace";
  }
  return "ok";
}

export function getInvitePreviewReason(args: {
  evaluation: InviteEvaluation;
  inviteFound: boolean;
  callerHasAnyMembership: boolean;
  callerInTargetWorkspace: boolean;
}): InvitePreviewReason {
  if (!args.inviteFound) {
    return "invalid-token";
  }
  if (!args.evaluation.usable) {
    if (args.evaluation.kind === "expired") {
      return "expired";
    }
    if (args.evaluation.kind === "revoked") {
      return "revoked";
    }
    return "consumed";
  }
  if (args.callerInTargetWorkspace) {
    return "already-member";
  }
  if (args.callerHasAnyMembership) {
    return "already-in-another-workspace";
  }
  return "ok";
}
