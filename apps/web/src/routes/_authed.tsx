import { api } from "@flowcamp/backend/convex/_generated/api";
import { Navigate, Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";

import { AppShell } from "@/components/app-shell";
import Loader from "@/components/loader";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context }) => {
    if (context.auth.isLoading) return;

    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onboarding = useQuery(api.users.getOnboardingState, isAuthenticated ? {} : "skip");

  if (authLoading || (isAuthenticated && onboarding === undefined)) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (onboarding?.needsWorkspaceCreation && pathname !== "/workspace-setup") {
    return <Navigate to="/workspace-setup" />;
  }
  if (!onboarding?.needsWorkspaceCreation && pathname === "/workspace-setup") {
    return <Navigate to="/dashboard" />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
