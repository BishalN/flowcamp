import { api } from "@flowcamp/backend/convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@flowcamp/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flowcamp/ui/components/card";

export const Route = createFileRoute("/join/$token")({
  component: JoinPage,
});

function reasonCopy(reason: string): string {
  switch (reason) {
    case "expired":
      return "This invite link has expired.";
    case "revoked":
      return "This invite link is no longer valid.";
    case "consumed":
      return "This invite has already been used.";
    case "invalid-token":
      return "This invite link is not valid.";
    case "already-member":
      return "You’re already in this workspace.";
    case "already-in-another-workspace":
      return "You’re already in a workspace. Flowcamp supports one workspace per account for now.";
    default:
      return "This invite can’t be used right now.";
  }
}

function JoinPage() {
  const { token } = Route.useParams();
  const preview = useQuery(api.workspaceInvites.getInvitePreview, { token });
  const { isAuthenticated } = useConvexAuth();
  const accept = useMutation(api.workspaceInvites.accept);
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  async function onAccept() {
    setPending(true);
    try {
      await accept({ token });
      toast.success("You’ve joined the workspace");
      await navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept invite");
    } finally {
      setPending(false);
    }
  }

  if (preview === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading invite…</p>
      </div>
    );
  }

  const blocked = preview.reason !== "ok" && preview.reason !== "already-member";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-16">
      <Card className="w-full max-w-md shadow-sm ring-1 ring-border/60">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl">
            {preview.workspaceName ?? "Workspace invite"}
          </CardTitle>
          <CardDescription>
            {preview.inviterName ? `Invited by ${preview.inviterName}` : "You’ve been invited to collaborate."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {blocked ? (
            <p className="text-center text-sm text-muted-foreground">{reasonCopy(preview.reason)}</p>
          ) : preview.reason === "already-member" ? (
            <p className="text-center text-sm text-muted-foreground">{reasonCopy(preview.reason)}</p>
          ) : !isAuthenticated ? (
            <div className="flex flex-col gap-3">
              <p className="text-center text-sm text-muted-foreground">
                Sign in or create an account to accept this invite.
              </p>
              <Button
                className="w-full rounded-full"
                render={<Link to="/login" />}
              >
                Go to sign in
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className="w-full rounded-full"
              disabled={pending}
              onClick={() => void onAccept()}
            >
              {pending ? "Joining…" : "Accept invite"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
