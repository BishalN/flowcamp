import { api } from "@flowcamp/backend/convex/_generated/api";
import { Navigate, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";

import { AppShell } from "@/components/app-shell";
import Loader from "@/components/loader";

export const Route = createFileRoute("/_authed")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const storeCurrentUser = useMutation(api.users.storeCurrentUser);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const seeded = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || seeded.current) {
      return;
    }
    seeded.current = true;
    void storeCurrentUser().catch(() => {
      seeded.current = false;
    });
  }, [isAuthenticated, storeCurrentUser]);

  const bootstrap = useQuery(api.users.getBootstrapState, isAuthenticated ? {} : "skip");

  if (authLoading || (isAuthenticated && bootstrap === undefined)) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (bootstrap === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (bootstrap.needsUserRecord) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (bootstrap.needsWorkspaceCreation && pathname !== "/workspace-setup") {
    return <Navigate to="/workspace-setup" />;
  }

  if (!bootstrap.needsWorkspaceCreation && pathname === "/workspace-setup") {
    return <Navigate to="/dashboard" />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
