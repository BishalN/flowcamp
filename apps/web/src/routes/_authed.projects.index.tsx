import { api } from "@flowcamp/backend/convex/_generated/api";
import type { Id } from "@flowcamp/backend/convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { CreateProjectDialog } from "@/components/create-project-dialog";

import { Button } from "@flowcamp/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@flowcamp/ui/components/card";
import { Skeleton } from "@flowcamp/ui/components/skeleton";
import { cn } from "@flowcamp/ui/lib/utils";

export const Route = createFileRoute("/_authed/projects/")({
  component: ProjectsListPage,
});

function ProjectsListPage() {
  const projects = useQuery(api.projects.list);
  const [createOpen, setCreateOpen] = useState(false);

  if (projects === undefined) {
    return <ProjectsListSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Everything your workspace is working on.</p>
        </div>
        <Button
          type="button"
          className="rounded-full motion-safe:active:scale-[0.98]"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon data-icon="inline-start" />
          New project
        </Button>
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />

      {projects.length === 0 ? (
        <Card className="border-dashed border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">No projects yet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Create a project to add a message board, to-dos, docs, and chat in one place.
            </p>
            <Button type="button" className="w-fit rounded-full" onClick={() => setCreateOpen(true)}>
              Create your first project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((p) => (
            <li key={p._id}>
              <ProjectRow projectId={p._id} name={p.name} description={p.description} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProjectsListSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading projects"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-44 sm:w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-10 w-36 shrink-0 rounded-full sm:self-end" />
      </div>
      <ul className="flex flex-col gap-2" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <div className="rounded-xl ring-1 ring-border/70">
              <div className="space-y-2 px-6 py-4">
                <Skeleton className="h-5 w-2/5 max-w-xs" />
                <Skeleton className="h-4 w-4/5 max-w-lg" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectRow({
  projectId,
  name,
  description,
}: {
  projectId: Id<"projects">;
  name: string;
  description?: string;
}) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId }}
      className={cn(
        "block rounded-xl ring-1 ring-border/70 transition-colors",
        "hover:bg-muted/40 hover:ring-primary/20",
        "motion-safe:active:scale-[0.995]",
      )}
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="py-4">
          <CardTitle className="text-base font-medium">{name}</CardTitle>
          {description ? (
            <p className="text-sm font-normal text-muted-foreground">{description}</p>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
