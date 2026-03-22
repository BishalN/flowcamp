export type WorkspaceRole = "owner" | "member";

/**
 * User can read workspace-scoped data only if they have a membership role.
 */
export function canReadWorkspace(role: WorkspaceRole | null): boolean {
  return role !== null;
}

/**
 * Only workspace owners can create/revoke invite links (Foundation slice).
 */
export function canManageInvites(role: WorkspaceRole | null): boolean {
  return role === "owner";
}

/**
 * First workspace can only be created if the user has no membership yet.
 */
export function canCreateFirstWorkspace(hasMembership: boolean): boolean {
  return !hasMembership;
}
