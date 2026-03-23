import { api } from "@flowcamp/backend/convex/_generated/api";
import type { Id } from "@flowcamp/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@flowcamp/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@flowcamp/ui/components/dialog";

// TODO: use relative time, add dayjs relative time formatter
function formatExpiry(ts: number) {
  return new Date(ts).toLocaleString();
}

export function InvitePeopleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const bootstrap = useQuery(api.users.getOnboardingState, open ? {} : "skip");
  const isOwner = bootstrap?.membership?.role === "owner";
  const active = useQuery(
    api.workspaceInvites.getActiveLink,
    open && isOwner ? {} : "skip",
  );
  const generate = useMutation(api.workspaceInvites.generate);
  const revoke = useMutation(api.workspaceInvites.revoke);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onGenerate() {
    setPending(true);
    try {
      const res = await generate({});
      setLastUrl(res.inviteUrl);
      toast.success("Invite link ready — copy and share.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create invite");
    } finally {
      setPending(false);
    }
  }

  async function onRevoke(id: Id<"workspaceInvites">) {
    setPending(true);
    try {
      await revoke({ inviteId: id });
      setLastUrl(null);
      toast.success("Invite link revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revoke");
    } finally {
      setPending(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  }

  const displayUrl = lastUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite people</DialogTitle>
          <DialogDescription>
            Share a link to invite teammates to this workspace. Links expire after a short period.
          </DialogDescription>
        </DialogHeader>
        {/* TODO: why are we loading here ? simplify all this undefined stuff here */}
        {bootstrap === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !isOwner ? (
          <p className="text-sm text-muted-foreground">
            Only workspace owners can create and manage invite links. Ask an owner to invite
            someone new.
          </p>
        ) : null}
        <div className="flex min-w-0 w-full flex-col gap-3">
          {bootstrap !== undefined && isOwner && active === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {bootstrap !== undefined && isOwner && active !== undefined && active ? (
            <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                Active invite · expires {formatExpiry(active.expiresAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                Generate a fresh link to see the URL — existing links stay valid until expiry or
                revoke.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onGenerate}>
                  New link
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => void onRevoke(active.inviteId)}
                >
                  Revoke
                </Button>
              </div>
            </div>
          ) : bootstrap !== undefined && isOwner && active !== undefined && active === null ? (
            <p className="text-sm text-muted-foreground">No active invite link yet.</p>
          ) : null}
          {displayUrl ? (
            <div className="flex min-w-0 w-full flex-col gap-2">
              <div className="flex min-w-0 w-full items-start gap-2 rounded-lg border border-border/60 bg-background p-2">
                <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed">
                  {displayUrl}
                </code>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => void copy(displayUrl)}
                  aria-label="Copy invite link"
                >
                  <CopyIcon />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter className="min-w-0 flex-wrap gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isOwner ? (
            <Button type="button" disabled={pending} onClick={onGenerate}>
              {pending ? "Working…" : displayUrl ? "Rotate link" : "Generate invite link"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
