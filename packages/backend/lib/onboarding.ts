export type BootstrapFlags = {
  needsUserRecord: boolean;
  needsWorkspaceCreation: boolean;
  canAcceptInvite: boolean;
};

/**
 * Derive onboarding flags from app user + membership presence.
 * Requires auth at the API layer; `hasAppUser` is false when the Better Auth session exists but `users` row is missing.
 */
export function deriveBootstrapFlags(input: {
  hasAppUser: boolean;
  hasMembership: boolean;
}): BootstrapFlags {
  const needsUserRecord = !input.hasAppUser;
  const needsWorkspaceCreation = input.hasAppUser && !input.hasMembership;
  const canAcceptInvite = input.hasAppUser && !input.hasMembership;
  return {
    needsUserRecord,
    needsWorkspaceCreation,
    canAcceptInvite,
  };
}
