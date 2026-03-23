import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useEffect, useRef, useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flowcamp/ui/components/card";
import { Skeleton } from "@flowcamp/ui/components/skeleton";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPageSkeleton() {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex max-w-lg flex-col items-center gap-3">
        <Skeleton className="h-11 w-44 md:h-12 md:w-52" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>

      <div
        className="w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-sm ring-1 ring-border/60"
        aria-hidden
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");
  const redirected = useRef(false);

  // TODO: shift this to onLoad, in createFileRoute, avoid useEffect hook as much as possible
  useEffect(() => {
    if (!authLoading && isAuthenticated && !redirected.current) {
      redirected.current = true;
      void navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || isAuthenticated) {
    return <LandingPageSkeleton />;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex max-w-lg flex-col gap-3 text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Flowcamp
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          A calm place for your team — projects, message boards, and to-dos without the noise.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-sm ring-1 ring-border/60">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl">
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {mode === "sign-in"
              ? "Sign in to open your workspace."
              : "Sign up to start your first workspace."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "sign-in" ? (
            <SignInForm onSwitchToSignUp={() => setMode("sign-up")} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setMode("sign-in")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
