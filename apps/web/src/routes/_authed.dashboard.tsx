import { api } from "@flowcamp/backend/convex/_generated/api";
import type { Id } from "@flowcamp/backend/convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { CalendarDaysIcon, CheckCircle2Icon, PlusIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";

import { CreateProjectDialog } from "@/components/create-project-dialog";
import { InvitePeopleDialog } from "@/components/invite-people-dialog";

import { Avatar, AvatarFallback, AvatarImage } from "@flowcamp/ui/components/avatar";
import { Badge } from "@flowcamp/ui/components/badge";
import { Button } from "@flowcamp/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@flowcamp/ui/components/card";
import { Separator } from "@flowcamp/ui/components/separator";
import { Skeleton } from "@flowcamp/ui/components/skeleton";
import { cn } from "@flowcamp/ui/lib/utils";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  // Is there a way to call this in loader or some other hook? but that would not have websocket conn right?
  const home = useQuery(api.home.get);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  if (home === undefined) {
    return <DashboardSkeleton />;
  }

  const primary = home.projects[0];
  const restPrimary = home.projects.slice(1);
  const workspaceName = home.workspace.name;
  const userInitial = workspaceName.slice(0, 1).toUpperCase();

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 md:px-6 md:py-14">
        <header className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {workspaceName}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              size="lg"
              className="rounded-full px-6 motion-safe:active:scale-[0.98]"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon data-icon="inline-start" />
              Create project
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="rounded-full border-primary/25 bg-card px-6 motion-safe:active:scale-[0.98]"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlusIcon data-icon="inline-start" />
              Invite people
            </Button>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Quiet workspace home — projects first. Add a project to get started.
          </p>
        </header>

        <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
        <InvitePeopleDialog open={inviteOpen} onOpenChange={setInviteOpen} />

        <section className="flex flex-col gap-6">
          {!primary ? (
            <EmptyProjectsHero onCreate={() => setCreateOpen(true)} />
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <h2 className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Recent
                </h2>
                <ProjectCardLarge projectId={primary._id} name={primary.name} initial={userInitial} />
              </div>
              {restPrimary.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <h2 className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    More projects
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {restPrimary.map((p) => (
                      <ProjectCardSmall key={p._id} projectId={p._id} name={p.name} initial={userInitial} />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        <Separator className="bg-border/70" />

        <section className="grid gap-6 md:grid-cols-2">
          <SchedulePanel />
          <AssignmentsPanel />
        </section>
      </div>

      <footer className="mt-auto border-t border-border/40 bg-muted/30 py-4">
        <p className="text-center text-xs text-muted-foreground">
          Flowcamp — calm collaboration, one workspace at a time.
        </p>
      </footer>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col" role="status" aria-busy="true" aria-label="Loading dashboard">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 md:px-6 md:py-14">
        <header className="flex flex-col items-center gap-6 text-center">
          <Skeleton className="h-12 w-56 max-w-[85vw] md:h-14 md:w-72" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Skeleton className="h-11 w-44 rounded-full" />
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </header>

        <section className="flex flex-col gap-6" aria-hidden>
          <div className="flex flex-col gap-3">
            <Skeleton className="mx-auto h-3 w-16" />
            <div className="rounded-2xl ring-1 ring-border/80">
              <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-3/5 max-w-xs" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="size-9 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        <Separator className="bg-border/70" />

        <section className="grid gap-6 md:grid-cols-2" aria-hidden>
          <div className="flex flex-col gap-4 rounded-xl bg-muted/20 p-4 ring-1 ring-border/60">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex flex-col gap-4 rounded-xl bg-muted/20 p-4 ring-1 ring-border/60">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="mx-auto size-16 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5 max-w-xs" />
          </div>
        </section>
      </div>

      <footer className="mt-auto border-t border-border/40 bg-muted/30 py-4">
        <Skeleton className="mx-auto h-3 w-64 max-w-[90vw]" />
      </footer>
    </div>
  );
}

function EmptyProjectsHero({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed border-primary/20 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-center font-serif text-xl">Create your first project</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Projects hold your message board, to-dos, docs, and chat. Start with a name — you can
          refine later.
        </p>
        <Button
          type="button"
          size="lg"
          className="rounded-full px-8 motion-safe:active:scale-[0.98]"
          onClick={onCreate}
        >
          <PlusIcon data-icon="inline-start" />
          Create project
        </Button>
      </CardContent>
    </Card>
  );
}

// TODO: maybe large and small should be in same component ?
function ProjectCardLarge({
  projectId,
  name,
  initial,
}: {
  projectId: Id<"projects">;
  name: string;
  initial: string;
}) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId }}
      className={cn(
        "group block rounded-2xl outline-none ring-1 ring-border/80 transition-shadow",
        "hover:shadow-md hover:ring-primary/20",
        "motion-safe:active:scale-[0.995]",
      )}
    >
      <Card className="border-0 bg-card shadow-sm ring-0">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle className="font-serif text-2xl font-semibold tracking-tight">{name}</CardTitle>
        </CardHeader>
        <CardFooter className="border-t border-border/50 bg-muted/20">
          <Avatar size="sm" className="size-9">
            <AvatarImage alt="" />
            <AvatarFallback className="bg-primary/15 text-primary">{initial}</AvatarFallback>
          </Avatar>
        </CardFooter>
      </Card>
    </Link>
  );
}
function ProjectCardSmall({
  projectId,
  name,
  initial,
}: {
  projectId: Id<"projects">;
  name: string;
  initial: string;
}) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId }}
      className={cn(
        "group block rounded-xl outline-none ring-1 ring-border/80 transition-shadow",
        "hover:shadow-md hover:ring-primary/15",
        "motion-safe:active:scale-[0.995]",
      )}
    >
      <Card size="sm" className="h-full border-0 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle className="font-medium">{name}</CardTitle>
        </CardHeader>
        <CardFooter className="border-t border-border/40 bg-muted/10 py-3">
          <Avatar size="sm" className="size-8">
            <AvatarImage alt="" />
            <AvatarFallback className="bg-primary/15 text-xs text-primary">{initial}</AvatarFallback>
          </Avatar>
        </CardFooter>
      </Card>
    </Link>
  );
}

function SchedulePanel() {
  const today = new Date();
  const monthLabel = today.toLocaleString("default", { month: "long" });
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const todayDate = today.getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: { day: number | null; isToday: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: null, isToday: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isToday: d === todayDate });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, isToday: false });
  }

  return (
    <Card className="overflow-hidden bg-muted/20 shadow-sm ring-1 ring-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <Badge variant="secondary" className="rounded-full font-normal">
          Your schedule
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl bg-zinc-900 p-4 text-zinc-100 ring-1 ring-zinc-800">
          <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium tracking-wide uppercase">{monthLabel}</span>
            <span>{year}</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
            {cells.map((cell, i) =>
              cell.day === null ? (
                <span key={i} className="p-1" />
              ) : (
                <span
                  key={i}
                  className={cn(
                    "rounded-md p-1",
                    cell.isToday && "bg-zinc-100 font-semibold text-zinc-900",
                    !cell.isToday && "text-zinc-400",
                  )}
                >
                  {cell.day}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {today.toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDaysIcon className="size-4 opacity-70" />
            Nothing&apos;s on the schedule yet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentsPanel() {
  return (
    <Card className="bg-muted/20 shadow-sm ring-1 ring-border/60">
      <CardHeader className="pb-2">
        <Badge variant="secondary" className="rounded-full font-normal">
          Your assignments
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <div
          className="flex size-16 items-center justify-center rounded-full bg-muted ring-1 ring-border/50"
          aria-hidden
        >
          <CheckCircle2Icon className="size-8 text-muted-foreground/50" />
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          You don&apos;t have any assignments right now. To-dos assigned to you will land here.
        </p>
      </CardContent>
    </Card>
  );
}
