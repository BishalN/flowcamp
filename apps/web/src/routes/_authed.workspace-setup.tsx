import { api } from "@flowcamp/backend/convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@flowcamp/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flowcamp/ui/components/card";
import { Input } from "@flowcamp/ui/components/input";
import { Label } from "@flowcamp/ui/components/label";

export const Route = createFileRoute("/_authed/workspace-setup")({
  component: WorkspaceSetupPage,
});

function WorkspaceSetupPage() {
  const navigate = useNavigate();
  const createWorkspace = useMutation(api.workspaces.createWorkspace);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a workspace name.");
      return;
    }
    setPending(true);
    try {
      await createWorkspace({ name: trimmed });
      toast.success("Workspace ready");
      await navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create workspace");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md shadow-sm ring-1 ring-border/60">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl">Name your workspace</CardTitle>
          <CardDescription>
            This is the shared home for your team in Flowcamp. You can invite people after you&apos;re
            in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Co"
                autoComplete="organization"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-full motion-safe:active:scale-[0.99]"
              disabled={pending}
            >
              {pending ? "Creating…" : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
